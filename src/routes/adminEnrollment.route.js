const express = require('express');
const router = express.Router();
const adminEnrollmentController = require('../controllers/adminEnrollment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleCheck = require('../middlewares/roleCheck.middleware');

// All routes require authentication
router.use(authMiddleware);

// Admin/Instructor only routes
router.use(roleCheck(['admin', 'instructor']));

/**
 * GET /api/admin/enrollments/courses/:courseId
 * Get all enrollments for a course
 */
router.get('/courses/:courseId', adminEnrollmentController.getCourseEnrollments);

/**
 * GET /api/admin/enrollments/courses/:courseId/batches/:batchId
 * Get enrollments for a specific batch
 */
router.get('/courses/:courseId/batches/:batchId', adminEnrollmentController.getBatchEnrollments);

/**
 * GET /api/admin/enrollments/courses/:courseId/stats
 * Get enrollment statistics for a course
 */
router.get('/courses/:courseId/stats', adminEnrollmentController.getCourseStats);

module.exports = router;
