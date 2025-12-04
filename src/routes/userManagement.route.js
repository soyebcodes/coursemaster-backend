const express = require('express');
const router = express.Router();
const userManagementController = require('../controllers/userManagement.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const Joi = require('joi');
const validate = require('../middlewares/validate.middleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/admin/users
 * Get all users with filtering and pagination
 */
router.get('/', userManagementController.getAllUsers);

/**
 * GET /api/admin/users/:userId
 * Get user details with enrollments
 */
router.get('/:userId', userManagementController.getUserDetails);

/**
 * POST /api/admin/users
 * Create a new user
 */
const createUserSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('student', 'instructor', 'admin').required()
});

router.post('/', validate(createUserSchema), userManagementController.createUser);

/**
 * PUT /api/admin/users/:userId
 * Update user
 */
const updateUserSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  role: Joi.string().valid('student', 'instructor', 'admin').optional(),
  isActive: Joi.boolean().optional()
});

router.put('/:userId', validate(updateUserSchema), userManagementController.updateUser);

/**
 * DELETE /api/admin/users/:userId
 * Delete user
 */
router.delete('/:userId', userManagementController.deleteUser);

/**
 * POST /api/admin/users/:userId/reset-password
 * Reset user password
 */
const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(6).required()
});

router.post('/:userId/reset-password', validate(resetPasswordSchema), userManagementController.resetPassword);

module.exports = router;
