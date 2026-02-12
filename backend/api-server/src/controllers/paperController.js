import Paper from '../models/Paper.js';
import { cacheHelpers } from '../config/redis.js';
import logger from '../utils/logger.js';

/**
 * @desc    Get all papers (with filters and pagination)
 * @route   GET /api/v1/papers
 * @access  Private
 */
const getPapers = async (req, res, next) => {
  try {
    console.log('GET /api/v1/papers query:', req.query);
    const {
      page = 1,
      limit = 20,
      sortBy = '-createdAt',
      category,
      source,
      search,
      myPapers
    } = req.query;

    // Build query
    const query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by source
    if (source) {
      query.source = source;
    }

    // Filter user's papers
    if (myPapers === 'true') {
      query.addedBy = req.user._id;
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const papers = await Paper.find(query)
      .select('title authors abstract keywords publicationDate category source citationCount')
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('addedBy', 'name email');

    // Get total count
    const total = await Paper.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        papers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get papers error:', error);
    next(error);
  }
};

/**
 * @desc    Get single paper by ID
 * @route   GET /api/v1/papers/:id
 * @access  Private
 */
const getPaperById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Try to get from cache first
    const cacheKey = `paper:${id}`;
    const cachedPaper = await cacheHelpers.get(cacheKey);

    if (cachedPaper) {
      logger.debug(`Paper ${id} served from cache`);
      return res.status(200).json({
        success: true,
        data: { paper: cachedPaper }
      });
    }

    // Get from database
    const paper = await Paper.findById(id)
      .populate('addedBy', 'name email institution')
      .populate('references', 'title authors publicationDate')
      .populate('citedBy', 'title authors publicationDate');

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Paper not found'
      });
    }

    // Increment view count
    paper.viewCount += 1;
    await paper.save();

    // Cache the paper
    await cacheHelpers.set(cacheKey, paper, 3600); // Cache for 1 hour

    res.status(200).json({
      success: true,
      data: { paper }
    });

  } catch (error) {
    logger.error('Get paper by ID error:', error);
    next(error);
  }
};

/**
 * @desc    Add new paper
 * @route   POST /api/v1/papers
 * @access  Private
 */
const addPaper = async (req, res, next) => {
  try {
    const paperData = {
      ...req.body,
      addedBy: req.user._id
    };

    // Check if paper already exists (by DOI or arXiv ID)
    if (paperData.doi || paperData.arxivId) {
      const existingPaper = await Paper.findOne({
        $or: [
          ...(paperData.doi ? [{ doi: paperData.doi }] : []),
          ...(paperData.arxivId ? [{ arxivId: paperData.arxivId }] : [])
        ]
      });

      if (existingPaper) {
        return res.status(400).json({
          success: false,
          message: 'Paper already exists in the database',
          data: { existingPaper }
        });
      }
    }

    // Create paper
    const paper = await Paper.create(paperData);

    logger.info(`New paper added: ${paper.title} by user ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Paper added successfully',
      data: { paper }
    });

  } catch (error) {
    logger.error('Add paper error:', error);
    next(error);
  }
};

/**
 * @desc    Update paper
 * @route   PUT /api/v1/papers/:id
 * @access  Private
 */
const updatePaper = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find paper
    let paper = await Paper.findById(id);

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Paper not found'
      });
    }

    // Check ownership or admin role
    if (paper.addedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this paper'
      });
    }

    // Update paper
    paper = await Paper.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    // Clear cache
    await cacheHelpers.del(`paper:${id}`);

    logger.info(`Paper updated: ${paper.title}`);

    res.status(200).json({
      success: true,
      message: 'Paper updated successfully',
      data: { paper }
    });

  } catch (error) {
    logger.error('Update paper error:', error);
    next(error);
  }
};

/**
 * @desc    Delete paper
 * @route   DELETE /api/v1/papers/:id
 * @access  Private
 */
const deletePaper = async (req, res, next) => {
  try {
    const { id } = req.params;

    const paper = await Paper.findById(id);

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Paper not found'
      });
    }

    // Check ownership or admin role
    if (paper.addedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this paper'
      });
    }

    await paper.deleteOne();

    // Clear cache
    await cacheHelpers.del(`paper:${id}`);

    logger.info(`Paper deleted: ${paper.title}`);

    res.status(200).json({
      success: true,
      message: 'Paper deleted successfully'
    });

  } catch (error) {
    logger.error('Delete paper error:', error);
    next(error);
  }
};

/**
 * @desc    Search papers
 * @route   GET /api/v1/papers/search
 * @access  Private
 */
const searchPapers = async (req, res, next) => {
  try {
    const {
      q, // search query
      category,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = '-publicationDate'
    } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build search options
    const options = {
      category,
      dateFrom,
      dateTo,
      sortBy,
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    };

    // Use static method from Paper model
    const papers = await Paper.searchPapers(q, options);

    // Get total count for pagination
    const totalQuery = {
      $text: { $search: q }
    };
    if (category) totalQuery.category = category;
    if (dateFrom || dateTo) {
      totalQuery.publicationDate = {};
      if (dateFrom) totalQuery.publicationDate.$gte = new Date(dateFrom);
      if (dateTo) totalQuery.publicationDate.$lte = new Date(dateTo);
    }
    const total = await Paper.countDocuments(totalQuery);

    res.status(200).json({
      success: true,
      data: {
        papers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        query: q
      }
    });

  } catch (error) {
    logger.error('Search papers error:', error);
    next(error);
  }
};

/**
 * @desc    Get similar papers
 * @route   GET /api/v1/papers/:id/similar
 * @access  Private
 */
const getSimilarPapers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;

    const similarPapers = await Paper.findSimilar(id, parseInt(limit));

    res.status(200).json({
      success: true,
      data: { papers: similarPapers }
    });

  } catch (error) {
    logger.error('Get similar papers error:', error);
    next(error);
  }
};

/**
 * @desc    Increment download count
 * @route   POST /api/v1/papers/:id/download
 * @access  Private
 */
const incrementDownloadCount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const paper = await Paper.findById(id);

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Paper not found'
      });
    }

    paper.downloadCount += 1;
    await paper.save();

    res.status(200).json({
      success: true,
      message: 'Download count updated',
      data: { downloadCount: paper.downloadCount }
    });

  } catch (error) {
    logger.error('Increment download count error:', error);
    next(error);
  }
};

/**
 * @desc    Get paper statistics
 * @route   GET /api/v1/papers/stats
 * @access  Private
 */
const getPaperStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Total papers by user
    const totalPapers = await Paper.countDocuments({ addedBy: userId });

    // Papers by category
    const papersByCategory = await Paper.aggregate([
      { $match: { addedBy: userId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Papers by source
    const papersBySource = await Paper.aggregate([
      { $match: { addedBy: userId } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent papers
    const recentPapers = await Paper.find({ addedBy: userId })
      .select('title authors publicationDate category')
      .sort('-createdAt')
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalPapers,
        papersByCategory,
        papersBySource,
        recentPapers
      }
    });

  } catch (error) {
    logger.error('Get paper stats error:', error);
    next(error);
  }
};

export {
  getPapers,
  getPaperById,
  addPaper,
  updatePaper,
  deletePaper,
  searchPapers,
  getSimilarPapers,
  incrementDownloadCount,
  getPaperStats
};