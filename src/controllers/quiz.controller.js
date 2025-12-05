const { quizModel, attemptModel } = require('../models/Quiz');
const Course = require('../models/Course');

/**
 * Get all quizzes for a specific course
 */
exports.getQuizzesByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    
    if (!courseId) {
      return res.status(400).json({ message: 'courseId is required' });
    }

    // Check if the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is enrolled in the course or is an admin/instructor
    const isAdminOrInstructor = ['admin', 'instructor'].includes(req.user.role);
    const isEnrolled = course.students.some(
      student => student.student.toString() === req.user.id
    );

    if (!isAdminOrInstructor && !isEnrolled) {
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }

    const quizzes = await quizModel.find({ course: courseId })
      .select('-questions.options.isCorrect') // Don't send correct answers
      .sort({ createdAt: -1 });

    res.json({ quizzes });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a quiz (Admin/Instructor only)
 */
exports.createQuiz = async (req, res, next) => {
  try {
    const { courseId, title, description, questions, passingScore } = req.body;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (course.instructor.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const quiz = await quizModel.create({
      course: courseId,
      title,
      description,
      questions: questions || [],
      passingScore: passingScore || 60
    });

    const populated = await quiz.populate('course', 'title');

    res.status(201).json({
      message: 'Quiz created',
      quiz: populated
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get quiz (without revealing correct answers to students)
 */
exports.getQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const quiz = await quizModel.findById(quizId).populate('course', 'title instructor');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // If student, don't reveal correct answers
    if (!isAdmin && quiz.course.instructor.toString() !== userId) {
      const sanitized = {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions.map(q => ({
          question: q.question,
          options: q.options.map(opt => ({
            text: opt.text
            // Don't send isCorrect
          }))
        }))
      };
      return res.json({ quiz: sanitized });
    }

    res.json({ quiz });
  } catch (err) {
    next(err);
  }
};

/**
 * Submit quiz attempt
 */
exports.submitQuizAttempt = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body; // answers = [{ questionIndex, selectedOption }, ...]
    const studentId = req.user.id;

    const quiz = await quizModel.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Calculate score
    let correctCount = 0;
    answers.forEach(answer => {
      const question = quiz.questions[answer.questionIndex];
      if (question) {
        const correct = question.options.find(
          opt => opt.text === answer.selectedOption && opt.isCorrect
        );
        if (correct) correctCount++;
      }
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    const attempt = await attemptModel.create({
      student: studentId,
      quiz: quizId,
      answers,
      score,
      passed
    });

    const populated = await attempt.populate('student', 'name email').populate('quiz', 'title passingScore');

    res.status(201).json({
      message: 'Quiz submitted',
      attempt: populated,
      score,
      passed
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get quiz attempts for admin review
 */
exports.getQuizAttempts = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const quiz = await quizModel.findById(quizId).populate('course');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Verify authorization
    if (
      quiz.course.instructor.toString() !== userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const total = await attemptModel.countDocuments({ quiz: quizId });
    const attempts = await attemptModel.find({ quiz: quizId })
      .populate('student', 'name email')
      .sort({ attemptedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      data: attempts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get student's best quiz attempt for a quiz
 */
exports.getStudentBestAttempt = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user.id;

    const attempts = await attemptModel.find({ quiz: quizId, student: studentId })
      .sort({ attemptedAt: -1 })
      .lean();

    if (attempts.length === 0) {
      return res.json({ attempt: null, message: 'No attempts yet' });
    }

    // Get best score
    const best = attempts.reduce((prev, current) =>
      prev.score > current.score ? prev : current
    );

    res.json({ attempt: best });
  } catch (err) {
    next(err);
  }
};
