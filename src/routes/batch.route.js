const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batch.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleCheck = require('../middlewares/roleCheck.middleware');
const Joi = require('joi');
const validate = require('../middlewares/validate.middleware');

// All routes require authentication
router.use(authMiddleware);

// Admin/Instructor only routes
const adminOnly = roleCheck(['admin', 'instructor']);

/**
 * POST /api/batches/courses/:courseId
 * Create a batch
 */
const createBatchSchema = Joi.object({
  name: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  maxStudents: Joi.number().integer().min(1).optional()
});

router.post('/courses/:courseId', adminOnly, validate(createBatchSchema), batchController.createBatch);

/**
 * GET /api/batches/courses/:courseId
 * Get all batches for a course
 */
router.get('/courses/:courseId', batchController.getBatches);

/**
 * PUT /api/batches/courses/:courseId/:batchId
 * Update a batch
 */
const updateBatchSchema = Joi.object({
  name: Joi.string().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  maxStudents: Joi.number().integer().min(1).optional()
});

router.put('/courses/:courseId/:batchId', adminOnly, validate(updateBatchSchema), batchController.updateBatch);

/**
 * DELETE /api/batches/courses/:courseId/:batchId
 * Delete a batch
 */
router.delete('/courses/:courseId/:batchId', adminOnly, batchController.deleteBatch);

/**
 * GET /api/batches/courses/:courseId/:batchId/students
 * Get students enrolled in a batch
 */
router.get('/courses/:courseId/:batchId/students', adminOnly, batchController.getBatchStudents);

/**
 * POST /api/batches/courses/:courseId/:batchId/enroll
 * Enroll student in a specific batch
 */
router.post('/courses/:courseId/:batchId/enroll', batchController.enrollInBatch);

module.exports = router;
