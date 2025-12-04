const express = require('express');
const router = express.Router();
const adminEnrollmentController = require('../controllers/adminEnrollment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleCheck = require('../middlewares/roleCheck.middleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/admin/enrollments/stats
 * Get global platform statistics (Admin only)
 */
router.get('/stats', roleCheck(['admin']), adminEnrollmentController.getPlatformStats);

/**
 * GET /api/admin/enrollments/courses/:courseId
 * Get all enrollments for a course (Admin/Instructor)
 */
router.get('/courses/:courseId', roleCheck(['admin', 'instructor']), adminEnrollmentController.getCourseEnrollments);

/**
 * GET /api/admin/enrollments/courses/:courseId/batches/:batchId
 * Get enrollments for a specific batch (Admin/Instructor)
 */
router.get('/courses/:courseId/batches/:batchId', roleCheck(['admin', 'instructor']), adminEnrollmentController.getBatchEnrollments);

/**
 * GET /api/admin/enrollments/courses/:courseId/stats
 * Get enrollment statistics for a course (Admin/Instructor)
 */
router.get('/courses/:courseId/stats', roleCheck(['admin', 'instructor']), adminEnrollmentController.getCourseStats);

module.exports = router;
