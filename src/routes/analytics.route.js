const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleCheck = require('../middlewares/roleCheck.middleware');

// All routes require authentication
router.use(authMiddleware);

// Admin only routes
const adminOnly = roleCheck(['admin']);

/**
 * GET /api/analytics/dashboard
 * Get dashboard analytics for admin
 */
router.get('/dashboard', adminOnly, analyticsController.getDashboardAnalytics);

/**
 * GET /api/analytics/courses/:courseId
 * Get course-specific analytics
 */
router.get('/courses/:courseId', analyticsController.getCourseAnalytics);

/**
 * GET /api/analytics/users
 * Get user management analytics
 */
router.get('/users', adminOnly, analyticsController.getUserAnalytics);

module.exports = router;
