import express from 'express';
const router = express.Router();
import {
    checkPlagiarism,
    getPlagiarismReport,
    comparePapers,
    checkAgainstLibrary,
    getSuggestions
} from '../controllers/plagiarismController.js';
import { protect } from '../middleware/auth.js';

// All routes require authentication
router.use(protect);

// @route   POST /api/v1/plagiarism/check
router.post('/check', checkPlagiarism);

// @route   GET /api/v1/plagiarism/report/:id
router.get('/report/:id', getPlagiarismReport);

// @route   POST /api/v1/plagiarism/compare
router.post('/compare', comparePapers);

// @route   POST /api/v1/plagiarism/check-library
router.post('/check-library', checkAgainstLibrary);

// @route   POST /api/v1/plagiarism/suggestions
router.post('/suggestions', getSuggestions);

export default router;