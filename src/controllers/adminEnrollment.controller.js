const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

/**
 * Get all enrollments for a course (Admin/Instructor only)
 */
exports.getCourseEnrollments = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Verify authorization
    if (
      course.instructor.toString() !== userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const total = await Enrollment.countDocuments({ course: courseId });
    const enrollments = await Enrollment.find({ course: courseId })
      .populate('student', 'name email')
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Add percentageCompleted
    const enriched = enrollments.map(e => ({
      ...e,
      percentageCompleted: Math.round(
        (e.progress.filter(p => p.completed).length / (e.progress.length || 1)) * 100
      )
    }));

    res.json({
      data: enriched,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get enrollments for a specific batch
 */
exports.getBatchEnrollments = async (req, res, next) => {
  try {
    const { courseId, batchId } = req.params;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Verify authorization
    if (
      course.instructor.toString() !== userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const total = await Enrollment.countDocuments({ course: courseId, batch: batchId });
    const enrollments = await Enrollment.find({ course: courseId, batch: batchId })
      .populate('student', 'name email')
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const enriched = enrollments.map(e => ({
      ...e,
      percentageCompleted: Math.round(
        (e.progress.filter(p => p.completed).length / (e.progress.length || 1)) * 100
      )
    }));

    res.json({
      data: enriched,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get enrollment statistics for a course
 */
exports.getCourseStats = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Verify authorization
    if (
      course.instructor.toString() !== userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const enrollments = await Enrollment.find({ course: courseId }).lean();

    const stats = {
      totalEnrollments: enrollments.length,
      activeEnrollments: enrollments.filter(e => e.status === 'active').length,
      completedEnrollments: enrollments.filter(e => e.status === 'completed').length,
      avgProgress: enrollments.length > 0
        ? Math.round(
            enrollments.reduce((sum, e) => {
              const completed = e.progress.filter(p => p.completed).length;
              return sum + (completed / (e.progress.length || 1)) * 100;
            }, 0) / enrollments.length
          )
        : 0
    };

    res.json({ stats });
  } catch (err) {
    next(err);
  }
};

/**
 * Get global platform statistics (Admin only)
 */
exports.getPlatformStats = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const totalCourses = await Course.countDocuments();
    const totalUsers = await User.countDocuments();
    const studentCount = await User.countDocuments({ role: 'student' });
    const instructorCount = await User.countDocuments({ role: 'instructor' });
    const totalEnrollments = await Enrollment.countDocuments();
    const completedEnrollments = await Enrollment.countDocuments({ status: 'completed' });

    const enrollments = await Enrollment.find().lean();
    const avgProgress = enrollments.length > 0
      ? Math.round(
          enrollments.reduce((sum, e) => {
            const completed = e.progress.filter(p => p.completed).length;
            return sum + (completed / (e.progress.length || 1)) * 100;
          }, 0) / enrollments.length
        )
      : 0;

    const stats = {
      totalCourses,
      totalUsers,
      studentCount,
      instructorCount,
      totalEnrollments,
      completedEnrollments,
      activeEnrollments: totalEnrollments - completedEnrollments,
      avgProgress
    };

    res.json({ stats });
  } catch (err) {
    next(err);
  }
};
