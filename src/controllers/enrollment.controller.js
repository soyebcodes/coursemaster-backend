const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { calculateProgress, initializeProgress } = require('../utils/progressHelper');

/**
 * Enroll a student in a course
 */
exports.enrollCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Check if already enrolled
    const existing = await Enrollment.findOne({ student: studentId, course: courseId });
    if (existing) return res.status(400).json({ message: 'Already enrolled in this course' });

    // Create enrollment with initialized progress
    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      progress: initializeProgress(course),
      percentageCompleted: 0
    });

    // Fix populate chaining issue
    await enrollment.populate('course', 'title');
    await enrollment.populate('student', 'name email');

    res.status(201).json({
      message: 'Successfully enrolled in course',
      enrollment
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all enrolled courses for a student
 */
exports.getEnrollments = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const total = await Enrollment.countDocuments({ student: studentId });
    const enrollments = await Enrollment.find({ student: studentId })
      .populate('course', 'title description price category lessons')
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate percentageCompleted for each enrollment
    const enrollmentsWithProgress = enrollments.map(enrollment => ({
      ...enrollment,
      percentageCompleted: calculateProgress(enrollment)
    }));

    res.json({
      data: enrollmentsWithProgress,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get a single enrollment details
 */
exports.getEnrollmentDetails = async (req, res, next) => {
  try {
    const { enrollmentId } = req.params;
    const studentId = req.user.id;

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('course')
      .populate('student', 'name email');

    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    // Verify ownership
    if (enrollment.student._id.toString() !== studentId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    enrollment.percentageCompleted = calculateProgress(enrollment);
    res.json({ enrollment });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark a lesson as completed
 */
exports.completeLessonForEnrollment = async (req, res, next) => {
  try {
    const { enrollmentId, lessonId } = req.params;
    const studentId = req.user.id;

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    // Verify ownership
    if (enrollment.student.toString() !== studentId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Find and mark lesson as completed
    const progressIndex = enrollment.progress.findIndex(
      p => p.lessonId.toString() === lessonId
    );

    if (progressIndex === -1) {
      return res.status(404).json({ message: 'Lesson not found in this course' });
    }

    if (!enrollment.progress[progressIndex].completed) {
      enrollment.progress[progressIndex].completed = true;
      enrollment.progress[progressIndex].completedAt = new Date();
    }

    // Update percentageCompleted
    enrollment.percentageCompleted = calculateProgress(enrollment);

    // Update status if 100% completed
    if (enrollment.percentageCompleted === 100) {
      enrollment.status = 'completed';
    }

    await enrollment.save();

    res.json({
      message: 'Lesson marked as completed',
      enrollment,
      percentageCompleted: enrollment.percentageCompleted
    });
  } catch (err) {
    next(err);
  }
};
