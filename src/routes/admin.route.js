const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleCheck = require('../middlewares/roleCheck.middleware');
const Joi = require('joi');
const validate = require('../middlewares/validate.middleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/admin/stats
 * Get global platform statistics (Admin only)
 */
router.get('/stats', roleCheck(['admin']), adminController.getPlatformStats);

/**
 * POST /api/admin/courses
 * Create a new course (Admin/Instructor)
 */
const createCourseSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  price: Joi.number().min(0).optional(),
  category: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  lessons: Joi.array().items(
    Joi.object({
      title: Joi.string().required(),
      videoUrl: Joi.string().uri().required(),
      content: Joi.string().optional(),
      order: Joi.number().optional()
    })
  ).optional(),
  batches: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      startDate: Joi.date().optional(),
      endDate: Joi.date().optional()
    })
  ).optional()
});

router.post('/courses', roleCheck(['admin', 'instructor']), validate(createCourseSchema), adminController.createCourse);

/**
 * PUT /api/admin/courses/:courseId
 * Update a course (Admin/Instructor)
 */
router.put('/courses/:courseId', roleCheck(['admin', 'instructor']), validate(createCourseSchema), adminController.updateCourse);

/**
 * DELETE /api/admin/courses/:courseId
 * Delete a course (Admin/Instructor)
 */
router.delete('/courses/:courseId', roleCheck(['admin', 'instructor']), adminController.deleteCourse);

/**
 * GET /api/admin/courses/:courseId/edit
 * Get course for editing (Admin/Instructor)
 */
router.get('/courses/:courseId/edit', roleCheck(['admin', 'instructor']), adminController.getCourseForEdit);

module.exports = router;
