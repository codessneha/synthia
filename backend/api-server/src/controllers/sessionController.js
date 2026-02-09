import Session from '../models/Session.js';
import Paper from '../models/Paper.js';
import { cacheHelpers } from '../config/redis.js';
import logger from '../utils/logger.js';

/**
 * @desc    Get all sessions for user
 * @route   GET /api/v1/sessions
 * @access  Private
 */
const getSessions = async (req, res, next) => {
  try {
    const {
      status = 'active',
      page = 1,
      limit = 20,
      sortBy = '-updatedAt',
      tags,
      search
    } = req.query;

    const options = {
      status,
      sortBy,
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      tags: tags ? tags.split(',') : undefined,
      search
    };

    const sessions = await Session.getUserSessions(req.user._id, options);

    // Get total count
    const query = { user: req.user._id, status };
    if (tags) query.tags = { $in: tags.split(',') };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    const total = await Session.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        sessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get sessions error:', error);
    next(error);
  }
};

/**
 * @desc    Get single session with full details
 * @route   GET /api/v1/sessions/:id
 * @access  Private
 */
const getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Try cache first
    const cacheKey = `session:${id}:${req.user._id}`;
    const cachedSession = await cacheHelpers.get(cacheKey);

    if (cachedSession) {
      return res.status(200).json({
        success: true,
        data: { session: cachedSession }
      });
    }

    // Get from database
    const session = await Session.getSessionDetails(id, req.user._id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or you do not have access'
      });
    }

    // Increment view count
    session.stats.viewCount += 1;
    await session.save();

    // Cache the session
    await cacheHelpers.set(cacheKey, session, 1800); // Cache for 30 minutes

    res.status(200).json({
      success: true,
      data: { session }
    });

  } catch (error) {
    logger.error('Get session by ID error:', error);
    next(error);
  }
};

/**
 * @desc    Create new session
 * @route   POST /api/v1/sessions
 * @access  Private
 */
const createSession = async (req, res, next) => {
  try {
    const { name, description, papers, tags, sessionType, settings } = req.body;

    // Validate papers exist
    if (papers && papers.length > 0) {
      const paperIds = papers.map(p => p.paper || p);
      const existingPapers = await Paper.find({ _id: { $in: paperIds } });

      if (existingPapers.length !== paperIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more papers not found'
        });
      }
    }

    // Determine session type based on paper count
    let type = sessionType;
    if (!type && papers) {
      type = papers.length === 1 ? 'single-paper' : 'multi-paper';
    }

    // Create session
    const session = await Session.create({
      name,
      description,
      user: req.user._id,
      papers: papers || [],
      tags: tags || [],
      sessionType: type || 'single-paper',
      settings: settings || {},
      stats: {
        lastActivityAt: new Date()
      }
    });

    // Populate papers
    await session.populate('papers.paper');

    logger.info(`Session created: ${name} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: { session }
    });

  } catch (error) {
    logger.error('Create session error:', error);
    next(error);
  }
};

/**
 * @desc    Update session
 * @route   PUT /api/v1/sessions/:id
 * @access  Private
 */
const updateSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, tags, settings, isPinned, status } = req.body;

    const session = await Session.findOne({ _id: id, user: req.user._id });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Update fields
    if (name) session.name = name;
    if (description !== undefined) session.description = description;
    if (tags) session.tags = tags;
    if (settings) session.settings = { ...session.settings, ...settings };
    if (isPinned !== undefined) session.isPinned = isPinned;
    if (status) session.status = status;

    await session.save();

    // Clear cache
    await cacheHelpers.del(`session:${id}:${req.user._id}`);

    logger.info(`Session updated: ${session.name}`);

    res.status(200).json({
      success: true,
      message: 'Session updated successfully',
      data: { session }
    });

  } catch (error) {
    logger.error('Update session error:', error);
    next(error);
  }
};

/**
 * @desc    Delete session
 * @route   DELETE /api/v1/sessions/:id
 * @access  Private
 */
const deleteSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;

    const session = await Session.findOne({ _id: id, user: req.user._id });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (permanent === 'true') {
      // Permanently delete
      await session.deleteOne();
      logger.info(`Session permanently deleted: ${session.name}`);
    } else {
      // Soft delete (archive)
      session.status = 'deleted';
      await session.save();
      logger.info(`Session archived: ${session.name}`);
    }

    // Clear cache
    await cacheHelpers.del(`session:${id}:${req.user._id}`);

    res.status(200).json({
      success: true,
      message: permanent === 'true' ? 'Session deleted permanently' : 'Session archived'
    });

  } catch (error) {
    logger.error('Delete session error:', error);
    next(error);
  }
};

/**
 * @desc    Add paper to session
 * @route   POST /api/v1/sessions/:id/papers
 * @access  Private
 */
const addPaperToSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paperId, notes } = req.body;

    const session = await Session.findOne({ _id: id, user: req.user._id });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if paper exists
    const paper = await Paper.findById(paperId);
    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Paper not found'
      });
    }

    // Add paper using session method
    await session.addPaper(paperId, notes);

    // Update session type if needed
    if (session.papers.length > 1 && session.sessionType === 'single-paper') {
      session.sessionType = 'multi-paper';
      await session.save();
    }

    // Clear cache
    await cacheHelpers.del(`session:${id}:${req.user._id}`);

    await session.populate('papers.paper');

    logger.info(`Paper added to session: ${session.name}`);

    res.status(200).json({
      success: true,
      message: 'Paper added to session',
      data: { session }
    });

  } catch (error) {
    logger.error('Add paper to session error:', error);
    next(error);
  }
};

/**
 * @desc    Remove paper from session
 * @route   DELETE /api/v1/sessions/:id/papers/:paperId
 * @access  Private
 */
const removePaperFromSession = async (req, res, next) => {
  try {
    const { id, paperId } = req.params;

    const session = await Session.findOne({ _id: id, user: req.user._id });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    await session.removePaper(paperId);

    // Clear cache
    await cacheHelpers.del(`session:${id}:${req.user._id}`);

    logger.info(`Paper removed from session: ${session.name}`);

    res.status(200).json({
      success: true,
      message: 'Paper removed from session',
      data: { session }
    });

  } catch (error) {
    logger.error('Remove paper from session error:', error);
    next(error);
  }
};

/**
 * @desc    Share session with users
 * @route   POST /api/v1/sessions/:id/share
 * @access  Private
 */
const shareSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userIds, permission = 'view' } = req.body;

    const session = await Session.findOne({ _id: id, user: req.user._id });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Add users to sharedWith
    userIds.forEach(userId => {
      const existingShare = session.sharedWith.find(
        s => s.user.toString() === userId.toString()
      );

      if (!existingShare) {
        session.sharedWith.push({
          user: userId,
          permission,
          sharedAt: new Date()
        });
      }
    });

    await session.save();

    logger.info(`Session shared: ${session.name} with ${userIds.length} users`);

    res.status(200).json({
      success: true,
      message: 'Session shared successfully',
      data: { session }
    });

  } catch (error) {
    logger.error('Share session error:', error);
    next(error);
  }
};

/**
 * @desc    Get session statistics
 * @route   GET /api/v1/sessions/stats
 * @access  Private
 */
const getSessionStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Total sessions
    const totalSessions = await Session.countDocuments({
      user: userId,
      status: { $ne: 'deleted' }
    });

    // Active sessions
    const activeSessions = await Session.countDocuments({
      user: userId,
      status: 'active'
    });

    // Sessions by type
    const sessionsByType = await Session.aggregate([
      { $match: { user: userId, status: 'active' } },
      { $group: { _id: '$sessionType', count: { $sum: 1 } } }
    ]);

    // Total messages
    const messageStats = await Session.aggregate([
      { $match: { user: userId, status: 'active' } },
      { $project: { messageCount: { $size: '$messages' } } },
      { $group: { _id: null, total: { $sum: '$messageCount' } } }
    ]);

    // Recent sessions
    const recentSessions = await Session.find({
      user: userId,
      status: 'active'
    })
      .select('name paperCount stats.lastActivityAt')
      .sort('-stats.lastActivityAt')
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalSessions,
        activeSessions,
        sessionsByType,
        totalMessages: messageStats[0]?.total || 0,
        recentSessions
      }
    });

  } catch (error) {
    logger.error('Get session stats error:', error);
    next(error);
  }
};

export {
  getSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  addPaperToSession,
  removePaperFromSession,
  shareSession,
  getSessionStats
};