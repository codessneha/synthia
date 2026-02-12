import paperSearchService from '../services/paperSearchService.js';
import logger from '../utils/logger.js';

/**
 * @desc    Search arXiv
 * @route   GET /api/v1/search/arxiv
 * @access  Private
 */
export const searchArxiv = async (req, res, next) => {
    try {
        const { q, max = 10, start = 0 } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const papers = await paperSearchService.searchArxiv(q, {
            maxResults: parseInt(max),
            start: parseInt(start)
        });

        res.status(200).json({
            success: true,
            data: { papers, source: 'arXiv' }
        });
    } catch (error) {
        logger.error('Search arXiv error:', error);
        next(error);
    }
};

/**
 * @desc    Search PubMed
 * @route   GET /api/v1/search/pubmed
 * @access  Private
 */
export const searchPubMed = async (req, res, next) => {
    try {
        const { q, max = 10, start = 0 } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const papers = await paperSearchService.searchPubMed(q, {
            maxResults: parseInt(max),
            start: parseInt(start)
        });

        res.status(200).json({
            success: true,
            data: { papers, source: 'PubMed' }
        });
    } catch (error) {
        logger.error('Search PubMed error:', error);
        next(error);
    }
};

/**
 * @desc    Search Semantic Scholar
 * @route   GET /api/v1/search/semantic-scholar
 * @access  Private
 */
export const searchSemanticScholar = async (req, res, next) => {
    try {
        const { q, max = 10, offset = 0 } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const papers = await paperSearchService.searchSemanticScholar(q, {
            limit: parseInt(max),
            offset: parseInt(offset)
        });

        res.status(200).json({
            success: true,
            data: { papers, source: 'Semantic Scholar' }
        });
    } catch (error) {
        logger.error('Search Semantic Scholar error:', error);
        next(error);
    }
};

/**
 * @desc    Search all sources
 * @route   GET /api/v1/search/all
 * @access  Private
 */
export const searchAll = async (req, res, next) => {
    try {
        const { q, max = 10, sources } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const searchSources = sources ? sources.split(',') : ['arxiv', 'pubmed', 'semantic_scholar'];
        const results = await paperSearchService.searchAll(q, {
            sources: searchSources,
            maxResults: parseInt(max)
        });

        res.status(200).json({
            success: true,
            data: { ...results }
        });
    } catch (error) {
        logger.error('Search all error:', error);
        next(error);
    }
};
