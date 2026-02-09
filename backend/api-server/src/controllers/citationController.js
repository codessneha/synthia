import Citation from '../models/Citation.js';
import Paper from '../models/Paper.js';
import logger from '../utils/logger.js';

/**
 * @desc    Get all citations for user
 * @route   GET /api/v1/citations
 * @access  Private
 */
const getCitations = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = '-createdAt',
      project,
      format
    } = req.query;

    const query = { user: req.user._id };

    if (project) {
      query.project = project;
    }

    if (format) {
      query.format = format;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const citations = await Citation.find(query)
      .populate('paper', 'title authors publicationDate doi')
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Citation.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        citations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get citations error:', error);
    next(error);
  }
};

/**
 * @desc    Generate citation from paper or manual entry
 * @route   POST /api/v1/citations
 * @access  Private
 */
const generateCitation = async (req, res, next) => {
  try {
    const { paperId, format, manualEntry, project, notes, tags } = req.body;

    let paperData;
    let citationData = {
      user: req.user._id,
      format,
      project,
      notes,
      tags: tags || []
    };

    // If paperId is provided, fetch paper from database
    if (paperId) {
      const paper = await Paper.findById(paperId);
      
      if (!paper) {
        return res.status(404).json({
          success: false,
          message: 'Paper not found'
        });
      }

      citationData.paper = paperId;
      
      paperData = {
        title: paper.title,
        authors: paper.authors.map(a => a.name),
        year: paper.publicationDate ? paper.publicationDate.getFullYear() : 'n.d.',
        journal: paper.journal?.name || '',
        volume: paper.journal?.volume || '',
        pages: paper.journal?.pages || '',
        doi: paper.doi || ''
      };
    } 
    // If manual entry is provided
    else if (manualEntry) {
      citationData.manualEntry = manualEntry;
      paperData = {
        title: manualEntry.title,
        authors: manualEntry.authors || [],
        year: manualEntry.year || 'n.d.',
        journal: manualEntry.journal || '',
        volume: manualEntry.volume || '',
        pages: manualEntry.pages || '',
        doi: manualEntry.doi || ''
      };
    } 
    else {
      return res.status(400).json({
        success: false,
        message: 'Either paperId or manualEntry is required'
      });
    }

    // Generate formatted citation
    const formattedCitation = Citation.generateCitation(paperData, format);
    citationData.formattedCitation = formattedCitation;

    // Generate BibTeX
    const citationKey = `${paperData.authors[0]?.split(' ').pop() || 'unknown'}${paperData.year}`;
    citationData.bibTeX = Citation.generateBibTeX(paperData, citationKey);

    // Create citation
    const citation = await Citation.create(citationData);

    logger.info(`Citation generated for user: ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Citation generated successfully',
      data: { citation }
    });

  } catch (error) {
    logger.error('Generate citation error:', error);
    next(error);
  }
};

/**
 * @desc    Get citation by ID
 * @route   GET /api/v1/citations/:id
 * @access  Private
 */
const getCitationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const citation = await Citation.findOne({
      _id: id,
      user: req.user._id
    }).populate('paper');

    if (!citation) {
      return res.status(404).json({
        success: false,
        message: 'Citation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { citation }
    });

  } catch (error) {
    logger.error('Get citation by ID error:', error);
    next(error);
  }
};

/**
 * @desc    Update citation
 * @route   PUT /api/v1/citations/:id
 * @access  Private
 */
const updateCitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { project, notes, tags, isFavorite } = req.body;

    let citation = await Citation.findOne({
      _id: id,
      user: req.user._id
    });

    if (!citation) {
      return res.status(404).json({
        success: false,
        message: 'Citation not found'
      });
    }

    // Update fields
    if (project !== undefined) citation.project = project;
    if (notes !== undefined) citation.notes = notes;
    if (tags) citation.tags = tags;
    if (isFavorite !== undefined) citation.isFavorite = isFavorite;

    await citation.save();

    res.status(200).json({
      success: true,
      message: 'Citation updated successfully',
      data: { citation }
    });

  } catch (error) {
    logger.error('Update citation error:', error);
    next(error);
  }
};

/**
 * @desc    Delete citation
 * @route   DELETE /api/v1/citations/:id
 * @access  Private
 */
const deleteCitation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const citation = await Citation.findOne({
      _id: id,
      user: req.user._id
    });

    if (!citation) {
      return res.status(404).json({
        success: false,
        message: 'Citation not found'
      });
    }

    await citation.deleteOne();

    logger.info(`Citation deleted for user: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Citation deleted successfully'
    });

  } catch (error) {
    logger.error('Delete citation error:', error);
    next(error);
  }
};

/**
 * @desc    Generate bulk citations
 * @route   POST /api/v1/citations/bulk
 * @access  Private
 */
const generateBulkCitations = async (req, res, next) => {
  try {
    const { paperIds, format, project } = req.body;

    if (!paperIds || paperIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Paper IDs are required'
      });
    }

    const papers = await Paper.find({ _id: { $in: paperIds } });

    if (papers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No papers found'
      });
    }

    const citations = [];

    for (const paper of papers) {
      const paperData = {
        title: paper.title,
        authors: paper.authors.map(a => a.name),
        year: paper.publicationDate ? paper.publicationDate.getFullYear() : 'n.d.',
        journal: paper.journal?.name || '',
        volume: paper.journal?.volume || '',
        pages: paper.journal?.pages || '',
        doi: paper.doi || ''
      };

      const formattedCitation = Citation.generateCitation(paperData, format);
      const citationKey = `${paperData.authors[0]?.split(' ').pop() || 'unknown'}${paperData.year}`;
      const bibTeX = Citation.generateBibTeX(paperData, citationKey);

      const citation = await Citation.create({
        user: req.user._id,
        paper: paper._id,
        format,
        formattedCitation,
        bibTeX,
        project
      });

      citations.push(citation);
    }

    logger.info(`${citations.length} bulk citations generated for user: ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: `${citations.length} citations generated successfully`,
      data: { citations }
    });

  } catch (error) {
    logger.error('Generate bulk citations error:', error);
    next(error);
  }
};

/**
 * @desc    Export citations
 * @route   GET /api/v1/citations/export
 * @access  Private
 */
const exportCitations = async (req, res, next) => {
  try {
    const { format = 'bibtex', project } = req.query;

    const query = { user: req.user._id };
    if (project) query.project = project;

    const citations = await Citation.find(query).populate('paper');

    let exportData;
    let contentType;
    let filename;

    switch (format) {
      case 'bibtex':
        exportData = citations.map(c => c.bibTeX).join('\n\n');
        contentType = 'application/x-bibtex';
        filename = 'citations.bib';
        break;

      case 'ris':
        // RIS format would be implemented here
        exportData = 'RIS format not yet implemented';
        contentType = 'application/x-research-info-systems';
        filename = 'citations.ris';
        break;

      case 'json':
        exportData = JSON.stringify(citations, null, 2);
        contentType = 'application/json';
        filename = 'citations.json';
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export format'
        });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);

  } catch (error) {
    logger.error('Export citations error:', error);
    next(error);
  }
};

export {
  getCitations,
  generateCitation,
  getCitationById,
  updateCitation,
  deleteCitation,
  generateBulkCitations,
  exportCitations
};