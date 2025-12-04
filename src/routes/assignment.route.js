const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleCheck = require('../middlewares/roleCheck.middleware');
const Joi = require('joi');
const validate = require('../middlewares/validate.middleware');

// All routes require authentication
router.use(authMiddleware);

router.get('/', assignmentController.listAssignments);

/**
 * POST /api/assignments/:assignmentId/submit
 * Student submits an assignment
 */
const submitSchema = Joi.object({
  submissionText: Joi.string().optional().allow(''),
  submissionLink: Joi.string().uri().optional().allow('')
});

router.post('/:assignmentId/submit', validate(submitSchema), assignmentController.submitAssignment);

// Admin/Instructor only routes
const adminOnly = roleCheck(['admin', 'instructor']);

/**
 * POST /api/assignments/courses/:courseId
 * Create an assignment
 */
const createAssignmentSchema = Joi.object({
  courseId: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().optional(),
  dueDate: Joi.date().optional()
});

router.post(
  '/courses/:courseId',
  adminOnly,
  validate(createAssignmentSchema),
  assignmentController.createAssignment
);

/**
 * GET /api/assignments/:assignmentId/submissions
 * Get all submissions for an assignment
 */
router.get('/:assignmentId/submissions', adminOnly, assignmentController.getAssignmentSubmissions);

/**
 * POST /api/assignments/submissions/:submissionId/grade
 * Grade a submission
 */
const gradeSchema = Joi.object({
  grade: Joi.number().min(0).max(100).required(),
  feedback: Joi.string().optional()
});

router.post(
  '/submissions/:submissionId/grade',
  adminOnly,
  validate(gradeSchema),
  assignmentController.gradeSubmission
);

/**
 * GET /api/assignments/courses/:courseId/submissions
 * Get all student submissions for a course
 */
router.get('/courses/:courseId/submissions', assignmentController.getStudentSubmissions);

module.exports = router;
