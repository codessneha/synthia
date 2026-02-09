import express from 'express';
const router = express.Router();
import {
  getPapers,
  getPaperById,
  addPaper,
  updatePaper,
  deletePaper,
  searchPapers,
  getSimilarPapers,
  incrementDownloadCount,
  getPaperStats
} from '../controllers/paperController.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  mongoIdValidation,
  paginationValidation,
  searchValidation
} from '../middleware/validation.js';
import { body } from 'express-validator';

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/v1/papers/stats
 * @desc    Get paper statistics for current user
 * @access  Private
 */
router.get('/stats', getPaperStats);

/**
 * @route   GET /api/v1/papers/search
 * @desc    Search papers
 * @access  Private
 */
router.get('/search', searchValidation, searchPapers);

/**
 * @route   GET /api/v1/papers
 * @desc    Get all papers with filters
 * @access  Private
 */
router.get('/', paginationValidation, getPapers);

/**
 * @route   POST /api/v1/papers
 * @desc    Add new paper
 * @access  Private
 */
router.post(
  '/',
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Paper title is required'),
    body('authors')
      .isArray({ min: 1 })
      .withMessage('At least one author is required'),
    body('authors.*.name')
      .notEmpty()
      .withMessage('Author name is required'),
    body('abstract')
      .trim()
      .notEmpty()
      .withMessage('Abstract is required'),
    body('source')
      .isIn(['arXiv', 'PubMed', 'IEEE', 'ACM', 'Springer', 'Nature', 'Science', 'Manual', 'Other'])
      .withMessage('Invalid source')
  ],
  addPaper
);

/**
 * @route   GET /api/v1/papers/:id
 * @desc    Get single paper by ID
 * @access  Private
 */
router.get('/:id', mongoIdValidation('id'), getPaperById);

/**
 * @route   PUT /api/v1/papers/:id
 * @desc    Update paper
 * @access  Private
 */
router.put('/:id', mongoIdValidation('id'), updatePaper);

/**
 * @route   DELETE /api/v1/papers/:id
 * @desc    Delete paper
 * @access  Private
 */
router.delete('/:id', mongoIdValidation('id'), deletePaper);

/**
 * @route   GET /api/v1/papers/:id/similar
 * @desc    Get similar papers
 * @access  Private
 */
router.get('/:id/similar', mongoIdValidation('id'), getSimilarPapers);

/**
 * @route   POST /api/v1/papers/:id/download
 * @desc    Increment download count
 * @access  Private
 */
router.post('/:id/download', mongoIdValidation('id'), incrementDownloadCount);

export default router;