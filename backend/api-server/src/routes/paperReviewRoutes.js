import express from 'express';
const router = express.Router();
import {
  submitDraftPaper,
  analyzeDraft,
  reviewSection,
  checkStructure,
  checkQuality,
  checkCitations,
  getSuggestions,
  getReviewHistory,
  getReviewDetails,
  reanalyze,
  exportReport
} from '../controllers/paperReviewController';
import { protect } from '../middleware/auth';

// All routes require authentication
router.use(protect);

// @route   POST /api/v1/paper-review/submit
// @desc    Submit draft paper for review
router.post('/submit', submitDraftPaper);

// @route   POST /api/v1/paper-review/analyze/:reviewId
// @desc    Get comprehensive AI review
router.post('/analyze/:reviewId', analyzeDraft);

// @route   POST /api/v1/paper-review/section-review
// @desc    Get specific section review
router.post('/section-review', reviewSection);

// @route   POST /api/v1/paper-review/structure-check
// @desc    Check paper structure
router.post('/structure-check', checkStructure);

// @route   POST /api/v1/paper-review/quality-check
// @desc    Get writing quality analysis
router.post('/quality-check', checkQuality);

// @route   POST /api/v1/paper-review/citation-check
// @desc    Check citations and references
router.post('/citation-check', checkCitations);

// @route   POST /api/v1/paper-review/suggestions
// @desc    Get improvement suggestions
router.post('/suggestions', getSuggestions);

// @route   GET /api/v1/paper-review/history
// @desc    Get review history
router.get('/history', getReviewHistory);

// @route   GET /api/v1/paper-review/:reviewId
// @desc    Get review details
router.get('/:reviewId', getReviewDetails);

// @route   PUT /api/v1/paper-review/:reviewId/reanalyze
// @desc    Reanalyze with updated content
router.put('/:reviewId/reanalyze', reanalyze);

// @route   GET /api/v1/paper-review/:reviewId/export
// @desc    Export review report
router.get('/:reviewId/export', exportReport);

export default router;