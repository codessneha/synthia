import plagiarismService from '../services/plagiarismService.js';
import Paper from '../models/Paper.js';

// @desc    Check text for plagiarism
// @route   POST /api/v1/plagiarism/check
// @access  Private
export const checkPlagiarism = async (req, res, next) => {
    try {
        const { text, excludeReferences = [] } = req.body;

        if (!text || text.trim().length < 100) {
            return res.status(400).json({
                success: false,
                message: 'Text must be at least 100 characters long'
            });
        }

        // Check plagiarism against multiple sources
        const result = await plagiarismService.checkPlagiarism(text, {
            userId: req.user._id,
            excludeReferences
        });

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Plagiarism check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check plagiarism',
            error: error.message
        });
    }
};

// @desc    Get detailed plagiarism report
// @route   GET /api/v1/plagiarism/report/:id
// @access  Private
export const getPlagiarismReport = async (req, res, next) => {
    try {
        const report = await plagiarismService.getReport(req.params.id, req.user._id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Get report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get report',
            error: error.message
        });
    }
};

// @desc    Compare two papers for similarity
// @route   POST /api/v1/plagiarism/compare
// @access  Private
export const comparePapers = async (req, res, next) => {
    try {
        const { paperId1, paperId2 } = req.body;

        const paper1 = await Paper.findById(paperId1);
        const paper2 = await Paper.findById(paperId2);

        if (!paper1 || !paper2) {
            return res.status(404).json({
                success: false,
                message: 'One or both papers not found'
            });
        }

        const similarity = await plagiarismService.comparePapers(paper1, paper2);

        res.status(200).json({
            success: true,
            data: similarity
        });
    } catch (error) {
        console.error('Compare papers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to compare papers',
            error: error.message
        });
    }
};

// @desc    Check document against user's library
// @route   POST /api/v1/plagiarism/check-library
// @access  Private
export const checkAgainstLibrary = async (req, res, next) => {
    try {
        const { text } = req.body;

        // Get user's papers
        const userPapers = await Paper.find({ addedBy: req.user._id });

        const results = await plagiarismService.checkAgainstLibrary(text, userPapers);

        res.status(200).json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Check library error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check against library',
            error: error.message
        });
    }
};

// @desc    Get suggestions for improving originality
// @route   POST /api/v1/plagiarism/suggestions
// @access  Private
export const getSuggestions = async (req, res, next) => {
    try {
        const { text, matches } = req.body;

        const suggestions = await plagiarismService.generateSuggestions(text, matches);

        res.status(200).json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        console.error('Get suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate suggestions',
            error: error.message
        });
    }
};