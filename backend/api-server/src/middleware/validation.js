import { validationResult, body, param, query } from 'express-validator';

/**
 * Middleware to check validation results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log('Validation Errors for', req.originalUrl, ':', JSON.stringify(errors.array(), null, 2));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }

  next();
};

/**
 * Validation rules for user registration
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  validate
];

/**
 * Validation rules for user login
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),

  validate
];

/**
 * Validation rules for creating a session
 */
const createSessionValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Session name is required')
    .isLength({ max: 100 }).withMessage('Session name cannot exceed 100 characters'),

  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('papers')
    .optional()
    .isArray().withMessage('Papers must be an array'),

  body('papers.*')
    .optional()
    .isMongoId().withMessage('Invalid paper ID'),

  validate
];

/**
 * Validation rules for adding a message
 */
const addMessageValidation = [
  body('content')
    .trim()
    .notEmpty().withMessage('Message content is required')
    .isLength({ max: 5000 }).withMessage('Message cannot exceed 5000 characters'),

  body('role')
    .optional()
    .isIn(['user', 'assistant', 'system']).withMessage('Invalid role'),

  validate
];

/**
 * Validation for MongoDB ObjectId params
 */
const mongoIdValidation = (paramName = 'id') => [
  param(paramName)
    .isMongoId().withMessage(`Invalid ${paramName}`),

  validate
];

/**
 * Validation for pagination query params
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('sortBy')
    .optional()
    .isString().withMessage('Sort field must be a string'),

  validate
];

/**
 * Validation for search query
 */
const searchValidation = [
  query('q')
    .trim()
    .notEmpty().withMessage('Search query is required')
    .isLength({ min: 2, max: 200 }).withMessage('Search query must be 2-200 characters'),

  ...paginationValidation
];

/**
 * Validation for paper search
 */
const paperSearchValidation = [
  query('title')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Title must be at least 2 characters'),

  query('doi')
    .optional()
    .trim(),

  query('category')
    .optional()
    .isIn(['Computer Science', 'Physics', 'Mathematics', 'Biology',
      'Chemistry', 'Medicine', 'Engineering', 'Social Sciences', 'Other'])
    .withMessage('Invalid category'),

  ...paginationValidation
];

/**
 * Validation for citation generation
 */
const citationValidation = [
  body('paperId')
    .optional()
    .isMongoId().withMessage('Invalid paper ID'),

  body('format')
    .notEmpty().withMessage('Citation format is required')
    .isIn(['IEEE', 'APA', 'MLA', 'Chicago', 'Harvard', 'Vancouver',
      'ACS', 'AMA', 'ASA', 'AAA', 'Springer', 'Elsevier',
      'Nature', 'Science', 'ACM'])
    .withMessage('Invalid citation format'),

  body('manualEntry')
    .optional()
    .isObject().withMessage('Manual entry must be an object'),

  validate
];

export {
  validate,
  registerValidation,
  loginValidation,
  createSessionValidation,
  addMessageValidation,
  mongoIdValidation,
  paginationValidation,
  searchValidation,
  paperSearchValidation,
  citationValidation
};