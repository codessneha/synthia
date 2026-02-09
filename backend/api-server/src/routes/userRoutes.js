import express from 'express';
const router = express.Router();
import {
  getProfile,
  updateProfile,
  updatePreferences,
  deleteAccount,
  getUsers,
  getUserById,
  updateUserRole,
  deactivateUser
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';
import { mongoIdValidation } from '../middleware/validation.js';
import { body } from 'express-validator';

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', getProfile);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be 2-50 characters'),
    body('institution')
      .optional()
      .trim(),
    body('researchInterests')
      .optional()
      .isArray()
      .withMessage('Research interests must be an array')
  ],
  updateProfile
);

/**
 * @route   PUT /api/v1/users/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put(
  '/preferences',
  [
    body('citationFormat')
      .optional()
      .isIn(['IEEE', 'APA', 'MLA', 'Chicago', 'Harvard'])
      .withMessage('Invalid citation format'),
    body('theme')
      .optional()
      .isIn(['light', 'dark', 'auto'])
      .withMessage('Invalid theme')
  ],
  updatePreferences
);

/**
 * @route   DELETE /api/v1/users/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete(
  '/account',
  [
    body('password')
      .notEmpty()
      .withMessage('Password is required to delete account')
  ],
  deleteAccount
);

// Admin only routes
/**
 * @route   GET /api/v1/users
 * @desc    Get all users
 * @access  Private/Admin
 */
router.get('/', authorize('admin'), getUsers);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private/Admin
 */
router.get('/:id', [authorize('admin'), mongoIdValidation('id')], getUserById);

/**
 * @route   PUT /api/v1/users/:id/role
 * @desc    Update user role
 * @access  Private/Admin
 */
router.put(
  '/:id/role',
  [
    authorize('admin'),
    mongoIdValidation('id'),
    body('role')
      .isIn(['user', 'admin', 'researcher'])
      .withMessage('Invalid role')
  ],
  updateUserRole
);

/**
 * @route   PUT /api/v1/users/:id/deactivate
 * @desc    Deactivate user
 * @access  Private/Admin
 */
router.put(
  '/:id/deactivate',
  [authorize('admin'), mongoIdValidation('id')],
  deactivateUser
);

export default router;