const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const Joi = require('joi');
const validate = require('../middlewares/validate.middleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/students/enrollments/:courseId
 * Enroll student in a course
 */
router.post('/:courseId', enrollmentController.enrollCourse);

/**
 * GET /api/students/enrollments
 * Get all enrolled courses for current student
 */
router.get('/', enrollmentController.getEnrollments);

/**
 * GET /api/students/enrollments/:enrollmentId
 * Get enrollment details
 */
router.get('/:enrollmentId', enrollmentController.getEnrollmentDetails);

/**
 * PUT /api/students/enrollments/:enrollmentId/lessons/:lessonId
 * Mark a lesson as completed
 */
router.put('/:enrollmentId/lessons/:lessonId', enrollmentController.completeLessonForEnrollment);

module.exports = router;
