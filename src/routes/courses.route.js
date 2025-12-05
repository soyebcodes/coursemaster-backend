const express = require('express');
const router = express.Router();
const coursesController = require('../controllers/courses.controller');
const quizRouter = require('./quiz.route');

router.get('/', coursesController.list);
router.get('/:id', coursesController.getById);

// Mount quiz routes under /api/courses/:courseId/quizzes
router.use('/:courseId/quizzes', quizRouter);

module.exports = router;
