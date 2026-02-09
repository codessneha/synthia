import express from 'express';
const router = express.Router();
import {
  getSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  addPaperToSession,
  removePaperFromSession,
  shareSession,
  getSessionStats
} from '../controllers/sessionController.js';
import { protect } from '../middleware/auth.js';
import {
  createSessionValidation,
  mongoIdValidation,
  paginationValidation
} from '../middleware/validation.js';
import { body } from 'express-validator';

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/v1/sessions/stats
 * @desc    Get session statistics
 * @access  Private
 */
router.get('/stats', getSessionStats);

/**
 * @route   GET /api/v1/sessions
 * @desc    Get all sessions for user
 * @access  Private
 */
router.get('/', paginationValidation, getSessions);

/**
 * @route   POST /api/v1/sessions
 * @desc    Create new session
 * @access  Private
 */
router.post('/', createSessionValidation, createSession);

/**
 * @route   GET /api/v1/sessions/:id
 * @desc    Get session by ID
 * @access  Private
 */
router.get('/:id', mongoIdValidation('id'), getSessionById);

/**
 * @route   PUT /api/v1/sessions/:id
 * @desc    Update session
 * @access  Private
 */
router.put('/:id', mongoIdValidation('id'), updateSession);

/**
 * @route   DELETE /api/v1/sessions/:id
 * @desc    Delete/archive session
 * @access  Private
 */
router.delete('/:id', mongoIdValidation('id'), deleteSession);

/**
 * @route   POST /api/v1/sessions/:id/papers
 * @desc    Add paper to session
 * @access  Private
 */
router.post(
  '/:id/papers',
  [
    mongoIdValidation('id'),
    body('paperId')
      .notEmpty()
      .withMessage('Paper ID is required')
      .isMongoId()
      .withMessage('Invalid paper ID')
  ],
  addPaperToSession
);

/**
 * @route   DELETE /api/v1/sessions/:id/papers/:paperId
 * @desc    Remove paper from session
 * @access  Private
 */
router.delete(
  '/:id/papers/:paperId',
  [
    mongoIdValidation('id'),
    mongoIdValidation('paperId')
  ],
  removePaperFromSession
);

/**
 * @route   POST /api/v1/sessions/:id/share
 * @desc    Share session with users
 * @access  Private
 */
router.post(
  '/:id/share',
  [
    mongoIdValidation('id'),
    body('userIds')
      .isArray({ min: 1 })
      .withMessage('At least one user ID is required'),
    body('userIds.*')
      .isMongoId()
      .withMessage('Invalid user ID'),
    body('permission')
      .optional()
      .isIn(['view', 'comment', 'edit'])
      .withMessage('Invalid permission level')
  ],
  shareSession
);

export default router;