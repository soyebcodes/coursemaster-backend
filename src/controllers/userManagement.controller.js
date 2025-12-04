const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const bcrypt = require('bcrypt');

/**
 * Get all users with filtering and pagination (Admin only)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const { search, role, status } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get user details with enrollments (Admin only)
 */
exports.getUserDetails = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Get user's enrollments
    const enrollments = await Enrollment.find({ student: userId })
      .populate('course', 'title description price')
      .sort({ enrolledAt: -1 })
      .lean();

    // Get user's orders
    const Order = require('../models/Order');
    const orders = await Order.find({ user: userId })
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .lean();

    // Get user's assignment submissions
    const { submissionModel } = require('../models/Assignment');
    const submissions = await submissionModel.find({ student: userId })
      .populate('assignment', 'title')
      .sort({ submittedAt: -1 })
      .lean();

    // Get user's quiz attempts
    const { attemptModel } = require('../models/Quiz');
    const quizAttempts = await attemptModel.find({ student: userId })
      .populate('quiz', 'title')
      .sort({ attemptedAt: -1 })
      .lean();

    res.json({
      user,
      enrollments,
      orders,
      submissions,
      quizAttempts
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update user (Admin only)
 */
exports.updateUser = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { userId } = req.params;
    const { name, email, role, isActive } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete user (Admin only)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { userId } = req.params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Check if user has enrollments
    const enrollmentCount = await Enrollment.countDocuments({ student: userId });
    if (enrollmentCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete user with existing enrollments' 
      });
    }

    // Check if user is instructor of any courses
    const courseCount = await Course.countDocuments({ instructor: userId });
    if (courseCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete user who is instructor of courses' 
      });
    }

    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * Reset user password (Admin only)
 */
exports.resetPassword = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * Create user (Admin only)
 */
exports.createUser = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Validate role
    if (!['student', 'instructor', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      isActive: true
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (err) {
    next(err);
  }
};
