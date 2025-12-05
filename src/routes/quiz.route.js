const express = require('express');
const router = express.Router({ mergeParams: true });
const quizController = require('../controllers/quiz.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleCheck = require('../middlewares/roleCheck.middleware');
const Joi = require('joi');
const validate = require('../middlewares/validate.middleware');

// All routes require authentication
router.use(authMiddleware);

// Admin/Instructor only
const adminOnly = roleCheck(['admin', 'instructor']);

/**
 * GET /api/courses/:courseId/quizzes
 * Get all quizzes for a course
 */
router.get('/', (req, res, next) => {
  req.query.courseId = req.params.courseId; // Move courseId from params to query for the controller
  quizController.getQuizzesByCourse(req, res, next);
});

/**
 * POST /api/quizzes/courses/:courseId
 * Create a quiz
 */
const createQuizSchema = Joi.object({
  courseId: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().optional(),
  questions: Joi.array().items(
    Joi.object({
      question: Joi.string().required(),
      options: Joi.array().items(
        Joi.object({
          text: Joi.string().required(),
          isCorrect: Joi.boolean().required()
        })
      ).required(),
      explanation: Joi.string().optional()
    })
  ).optional(),
  passingScore: Joi.number().min(0).max(100).optional()
});

router.post('/courses/:courseId', adminOnly, validate(createQuizSchema), quizController.createQuiz);

/**
 * GET /api/quizzes/:quizId
 * Get quiz (sanitized for students)
 */
router.get('/:quizId', quizController.getQuiz);

/**
 * POST /api/quizzes/:quizId/submit
 * Student submits quiz attempt
 */
const submitSchema = Joi.object({
  answers: Joi.array().items(
    Joi.object({
      questionIndex: Joi.number().required(),
      selectedOption: Joi.string().required()
    })
  ).required()
});

router.post('/:quizId/submit', validate(submitSchema), quizController.submitQuizAttempt);

/**
 * GET /api/quizzes/:quizId/attempts
 * Get all attempts for a quiz (admin only)
 */
router.get('/:quizId/attempts', adminOnly, quizController.getQuizAttempts);

/**
 * GET /api/quizzes/:quizId/myattempt
 * Get student's best attempt for a quiz
 */
router.get('/:quizId/myattempt', quizController.getStudentBestAttempt);

module.exports = router;
