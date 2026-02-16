import paperReviewService from '../services/paperReviewService.js';
import Paper from '../models/Paper.js';
import logger from '../utils/logger.js';

import multer from 'multer';
import path from 'path';

// Configure file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/drafts/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'draft-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'));
    }
  }
});

// @desc    Submit draft paper for review
// @route   POST /api/v1/paper-review/submit
// @access  Private
export const submitDraftPaper = [
  upload.single('file'),
  async (req, res, next) => {
    try {
      const { title, abstract, sections } = req.body;
      const file = req.file;

      if (!file && !sections) {
        return res.status(400).json({
          success: false,
          message: 'Please provide either a file or text sections'
        });
      }

      // Create review record
      const review = await paperReviewService.submitForReview({
        userId: req.user._id,
        title,
        abstract,
        sections: sections ? JSON.parse(sections) : null,
        filePath: file ? file.path : null,
        fileName: file ? file.originalname : null
      });

      res.status(201).json({
        success: true,
        message: 'Draft submitted successfully',
        data: review
      });
    } catch (error) {
      logger.error('Submit draft error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit draft',
        error: error.message
      });
    }
  }
];

// @desc    Get comprehensive AI review
// @route   POST /api/v1/paper-review/analyze/:reviewId
// @access  Private
export const analyzeDraft = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { analysisTypes } = req.body;

    const analysis = await paperReviewService.performComprehensiveReview(
      reviewId,
      req.user._id,
      analysisTypes
    );

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('Analyze draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze draft',
      error: error.message
    });
  }
};

// @desc    Get specific section review
// @route   POST /api/v1/paper-review/section-review
// @access  Private
export const reviewSection = async (req, res, next) => {
  try {
    const { sectionType, content, context } = req.body;

    const review = await paperReviewService.reviewSection({
      sectionType,
      content,
      context
    });

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    logger.error('Section review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review section',
      error: error.message
    });
  }
};

// @desc    Check paper structure
// @route   POST /api/v1/paper-review/structure-check
// @access  Private
export const checkStructure = async (req, res, next) => {
  try {
    const { sections } = req.body;

    const structureAnalysis = await paperReviewService.analyzeStructure(sections);

    res.status(200).json({
      success: true,
      data: structureAnalysis
    });
  } catch (error) {
    logger.error('Structure check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check structure',
      error: error.message
    });
  }
};

// @desc    Get writing quality analysis
// @route   POST /api/v1/paper-review/quality-check
// @access  Private
export const checkQuality = async (req, res, next) => {
  try {
    const { content } = req.body;

    const quality = await paperReviewService.analyzeWritingQuality(content);

    res.status(200).json({
      success: true,
      data: quality
    });
  } catch (error) {
    logger.error('Quality check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check quality',
      error: error.message
    });
  }
};

// @desc    Check citations and references
// @route   POST /api/v1/paper-review/citation-check
// @access  Private
export const checkCitations = async (req, res, next) => {
  try {
    const { content, references } = req.body;

    const citationAnalysis = await paperReviewService.analyzeCitations(
      content,
      references
    );

    res.status(200).json({
      success: true,
      data: citationAnalysis
    });
  } catch (error) {
    logger.error('Citation check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check citations',
      error: error.message
    });
  }
};

// @desc    Get improvement suggestions
// @route   POST /api/v1/paper-review/suggestions
// @access  Private
export const getSuggestions = async (req, res, next) => {
  try {
    const { reviewId, focusAreas } = req.body;

    const suggestions = await paperReviewService.generateImprovementSuggestions(
      reviewId,
      focusAreas
    );

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    logger.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate suggestions',
      error: error.message
    });
  }
};

// @desc    Get review history
// @route   GET /api/v1/paper-review/history
// @access  Private
export const getReviewHistory = async (req, res, next) => {
  try {
    const reviews = await paperReviewService.getUserReviews(req.user._id);

    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    logger.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get review history',
      error: error.message
    });
  }
};

// @desc    Get review details
// @route   GET /api/v1/paper-review/:reviewId
// @access  Private
export const getReviewDetails = async (req, res, next) => {
  try {
    const review = await paperReviewService.getReviewById(
      req.params.reviewId,
      req.user._id
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    logger.error('Get review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get review',
      error: error.message
    });
  }
};

// @desc    Reanalyze with updated content
// @route   PUT /api/v1/paper-review/:reviewId/reanalyze
// @access  Private
export const reanalyze = async (req, res, next) => {
  try {
    const { sections } = req.body;

    const updatedReview = await paperReviewService.reanalyzeReview(
      req.params.reviewId,
      req.user._id,
      sections
    );

    res.status(200).json({
      success: true,
      data: updatedReview
    });
  } catch (error) {
    logger.error('Reanalyze error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reanalyze',
      error: error.message
    });
  }
};

// @desc    Export review report
// @route   GET /api/v1/paper-review/:reviewId/export
// @access  Private
export const exportReport = async (req, res, next) => {
  try {
    const { format = 'pdf' } = req.query;

    const report = await paperReviewService.exportReviewReport(
      req.params.reviewId,
      req.user._id,
      format
    );

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Export report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report',
      error: error.message
    });
  }
};

