import express from 'express';
const router = express.Router();
import {
  getCitations,
  generateCitation,
  getCitationById,
  updateCitation,
  deleteCitation,
  generateBulkCitations,
  exportCitations
} from '../controllers/citationController.js';
import { protect } from '../middleware/auth.js';
import { citationValidation, mongoIdValidation } from '../middleware/validation.js';
import { body } from 'express-validator';

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/v1/citations/export
 * @desc    Export citations
 * @access  Private
 */
router.get('/export', exportCitations);

/**
 * @route   POST /api/v1/citations/bulk
 * @desc    Generate bulk citations
 * @access  Private
 */
router.post(
  '/bulk',
  [
    body('paperIds')
      .isArray({ min: 1 })
      .withMessage('At least one paper ID is required'),
    body('paperIds.*')
      .isMongoId()
      .withMessage('Invalid paper ID'),
    body('format')
      .notEmpty()
      .withMessage('Citation format is required')
      .isIn(['IEEE', 'APA', 'MLA', 'Chicago', 'Harvard', 'Vancouver',
        'ACS', 'AMA', 'ASA', 'AAA', 'Springer', 'Elsevier',
        'Nature', 'Science', 'ACM'])
      .withMessage('Invalid citation format')
  ],
  generateBulkCitations
);

/**
 * @route   GET /api/v1/citations
 * @desc    Get all citations
 * @access  Private
 */
router.get('/', getCitations);

/**
 * @route   POST /api/v1/citations
 * @desc    Generate citation
 * @access  Private
 */
router.post('/', citationValidation, generateCitation);

/**
 * @route   GET /api/v1/citations/:id
 * @desc    Get citation by ID
 * @access  Private
 */
router.get('/:id', mongoIdValidation('id'), getCitationById);

/**
 * @route   PUT /api/v1/citations/:id
 * @desc    Update citation
 * @access  Private
 */
router.put('/:id', mongoIdValidation('id'), updateCitation);

/**
 * @route   DELETE /api/v1/citations/:id
 * @desc    Delete citation
 * @access  Private
 */
router.delete('/:id', mongoIdValidation('id'), deleteCitation);

export default router;