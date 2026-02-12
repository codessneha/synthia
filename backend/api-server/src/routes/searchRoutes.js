import express from 'express';
const router = express.Router();
import {
    searchArxiv,
    searchPubMed,
    searchSemanticScholar,
    searchAll
} from '../controllers/searchController.js';
import { protect } from '../middleware/auth.js';

// All search routes require authentication
router.use(protect);

/**
 * @route   GET /api/v1/search/arxiv
 * @desc    Search arXiv
 * @access  Private
 */
router.get('/arxiv', searchArxiv);

/**
 * @route   GET /api/v1/search/pubmed
 * @desc    Search PubMed
 * @access  Private
 */
router.get('/pubmed', searchPubMed);

/**
 * @route   GET /api/v1/search/semantic-scholar
 * @desc    Search Semantic Scholar
 * @access  Private
 */
router.get('/semantic-scholar', searchSemanticScholar);

/**
 * @route   GET /api/v1/search/all
 * @desc    Search all sources
 * @access  Private
 */
router.get('/all', searchAll);

export default router;
