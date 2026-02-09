import express from 'express';
const router = express.Router();
import {
  sendMessage,
  getMessages,
  clearMessages,
  analyzePapers,
  generateSummary,
  exportTranscript
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';
import { mongoIdValidation, addMessageValidation } from '../middleware/validation.js';
import { body, query } from 'express-validator';

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/v1/chat/:sessionId/message
 * @desc    Send message and get AI response
 * @access  Private
 */
router.post(
  '/:sessionId/message',
  [mongoIdValidation('sessionId'), addMessageValidation],
  sendMessage
);

/**
 * @route   GET /api/v1/chat/:sessionId/messages
 * @desc    Get chat messages
 * @access  Private
 */
router.get(
  '/:sessionId/messages',
  mongoIdValidation('sessionId'),
  getMessages
);

/**
 * @route   DELETE /api/v1/chat/:sessionId/messages
 * @desc    Clear chat history
 * @access  Private
 */
router.delete(
  '/:sessionId/messages',
  mongoIdValidation('sessionId'),
  clearMessages
);

/**
 * @route   POST /api/v1/chat/:sessionId/analyze
 * @desc    Analyze papers (comparative analysis)
 * @access  Private
 */
router.post(
  '/:sessionId/analyze',
  [
    mongoIdValidation('sessionId'),
    body('analysisType')
      .optional()
      .isIn(['compare', 'summarize', 'gap-analysis'])
      .withMessage('Invalid analysis type'),
    body('focusAreas')
      .optional()
      .isArray()
      .withMessage('Focus areas must be an array')
  ],
  analyzePapers
);

/**
 * @route   GET /api/v1/chat/:sessionId/summary
 * @desc    Generate conversation summary
 * @access  Private
 */
router.get(
  '/:sessionId/summary',
  mongoIdValidation('sessionId'),
  generateSummary
);

/**
 * @route   GET /api/v1/chat/:sessionId/export
 * @desc    Export chat transcript
 * @access  Private
 */
router.get(
  '/:sessionId/export',
  [
    mongoIdValidation('sessionId'),
    query('format')
      .optional()
      .isIn(['json', 'markdown', 'txt'])
      .withMessage('Invalid export format')
  ],
  exportTranscript
);

export default router;