import User from '../models/User.js';
import logger from '../utils/logger.js';

/**
 * @desc    Get user profile
 * @route   GET /api/v1/users/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    logger.error('Get profile error:', error);
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/v1/users/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const {
      name,
      institution,
      researchInterests,
      profilePicture
    } = req.body;

    const user = await User.findById(req.user._id);

    // Update fields
    if (name) user.name = name;
    if (institution !== undefined) user.institution = institution;
    if (researchInterests) user.researchInterests = researchInterests;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();

    logger.info(`Profile updated for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    next(error);
  }
};

/**
 * @desc    Update user preferences
 * @route   PUT /api/v1/users/preferences
 * @access  Private
 */
const updatePreferences = async (req, res, next) => {
  try {
    const { citationFormat, theme, notifications } = req.body;

    const user = await User.findById(req.user._id);

    // Update preferences
    if (citationFormat) user.preferences.citationFormat = citationFormat;
    if (theme) user.preferences.theme = theme;
    if (notifications) {
      user.preferences.notifications = {
        ...user.preferences.notifications,
        ...notifications
      };
    }

    await user.save();

    logger.info(`Preferences updated for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: { preferences: user.preferences }
    });

  } catch (error) {
    logger.error('Update preferences error:', error);
    next(error);
  }
};

/**
 * @desc    Delete user account
 * @route   DELETE /api/v1/users/account
 * @access  Private
 */
const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // Soft delete - deactivate account
    user.isActive = false;
    await user.save();

    // TODO: Delete or anonymize user data (sessions, papers, etc.)
    // This should be done based on your data retention policy

    logger.info(`Account deactivated for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    logger.error('Delete account error:', error);
    next(error);
  }
};

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/v1/users
 * @access  Private/Admin
 */
const getUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      isActive,
      search
    } = req.query;

    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get users error:', error);
    next(error);
  }
};

/**
 * @desc    Get user by ID (admin only)
 * @route   GET /api/v1/users/:id
 * @access  Private/Admin
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    logger.error('Get user by ID error:', error);
    next(error);
  }
};

/**
 * @desc    Update user role (admin only)
 * @route   PUT /api/v1/users/:id/role
 * @access  Private/Admin
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.role = role;
    await user.save();

    logger.info(`User role updated: ${user.email} -> ${role}`);

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: { user }
    });

  } catch (error) {
    logger.error('Update user role error:', error);
    next(error);
  }
};

/**
 * @desc    Deactivate user (admin only)
 * @route   PUT /api/v1/users/:id/deactivate
 * @access  Private/Admin
 */
const deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = false;
    await user.save();

    logger.info(`User deactivated: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    logger.error('Deactivate user error:', error);
    next(error);
  }
};

export {
  getProfile,
  updateProfile,
  updatePreferences,
  deleteAccount,
  getUsers,
  getUserById,
  updateUserRole,
  deactivateUser
};