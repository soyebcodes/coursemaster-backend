const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { assignmentModel, submissionModel } = require('../models/Assignment');
const { quizModel, attemptModel } = require('../models/Quiz');
const Order = require('../models/Order');

/**
 * Get dashboard analytics for admin
 */
exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Basic counts
    const [
      totalCourses,
      totalStudents,
      totalEnrollments,
      totalRevenue
    ] = await Promise.all([
      Course.countDocuments(),
      User.countDocuments({ role: 'student' }),
      Enrollment.countDocuments(),
      Order.countDocuments({ status: 'completed' })
    ]);

    // Recent enrollments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEnrollments = await Enrollment.countDocuments({
      enrolledAt: { $gte: thirtyDaysAgo }
    });

    // Revenue (last 30 days)
    const recentRevenue = await Order.aggregate([
      { $match: { status: 'completed', completedAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Enrollment trends (last 12 months)
    const enrollmentTrends = await Enrollment.aggregate([
      {
        $match: {
          enrolledAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$enrolledAt' },
            month: { $month: '$enrolledAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Popular courses
    const popularCourses = await Enrollment.aggregate([
      {
        $group: {
          _id: '$course',
          enrollmentCount: { $sum: 1 }
        }
      },
      { $sort: { enrollmentCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $project: {
          title: '$course.title',
          enrollmentCount: 1,
          price: '$course.price'
        }
      }
    ]);

    // Assignment completion stats
    const assignmentStats = await assignmentModel.aggregate([
      {
        $lookup: {
          from: 'submissions',
          localField: '_id',
          foreignField: 'assignment',
          as: 'submissions'
        }
      },
      {
        $project: {
          title: 1,
          totalSubmissions: { $size: '$submissions' },
          gradedSubmissions: {
            $size: {
              $filter: {
                input: '$submissions',
                cond: { $ne: ['$$this.grade', null] }
              }
            }
          }
        }
      },
      { $sort: { totalSubmissions: -1 } },
      { $limit: 5 }
    ]);

    // Quiz performance stats
    const quizStats = await quizModel.aggregate([
      {
        $lookup: {
          from: 'quizattempts',
          localField: '_id',
          foreignField: 'quiz',
          as: 'attempts'
        }
      },
      {
        $project: {
          title: 1,
          totalAttempts: { $size: '$attempts' },
          averageScore: {
            $avg: '$attempts.score'
          },
          passRate: {
            $multiply: [
              {
                $divide: [
                  {
                    $size: {
                      $filter: {
                        input: '$attempts',
                        cond: { $eq: ['$$this.passed', true] }
                      }
                    }
                  },
                  { $size: '$attempts' }
                ]
              },
              100
            ]
          }
        }
      },
      { $sort: { totalAttempts: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      overview: {
        totalCourses,
        totalStudents,
        totalEnrollments,
        totalRevenue,
        recentEnrollments,
        recentRevenue: recentRevenue[0]?.total || 0
      },
      trends: {
        enrollments: enrollmentTrends
      },
      popularCourses,
      assignmentStats,
      quizStats
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get course-specific analytics
 */
exports.getCourseAnalytics = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Verify course ownership or admin
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (course.instructor.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Enrollment stats
    const totalEnrollments = await Enrollment.countDocuments({ course: courseId });
    const activeEnrollments = await Enrollment.countDocuments({ 
      course: courseId, 
      status: 'active' 
    });
    const completedEnrollments = await Enrollment.countDocuments({ 
      course: courseId, 
      status: 'completed' 
    });

    // Progress distribution
    const progressDistribution = await Enrollment.aggregate([
      { $match: { course: courseId } },
      {
        $bucket: {
          groupBy: '$percentageCompleted',
          boundaries: [0, 25, 50, 75, 100],
          default: 'other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    // Assignment completion rates
    const assignmentCompletion = await assignmentModel.aggregate([
      { $match: { course: courseId } },
      {
        $lookup: {
          from: 'submissions',
          localField: '_id',
          foreignField: 'assignment',
          as: 'submissions'
        }
      },
      {
        $project: {
          title: 1,
          totalEnrollments: totalEnrollments,
          submissionsCount: { $size: '$submissions' },
          completionRate: {
            $multiply: [
              { $divide: [{ $size: '$submissions' }, totalEnrollments] },
              100
            ]
          }
        }
      }
    ]);

    // Quiz performance
    const quizPerformance = await quizModel.aggregate([
      { $match: { course: courseId } },
      {
        $lookup: {
          from: 'quizattempts',
          localField: '_id',
          foreignField: 'quiz',
          as: 'attempts'
        }
      },
      {
        $project: {
          title: 1,
          totalAttempts: { $size: '$attempts' },
          averageScore: { $avg: '$attempts.score' },
          passRate: {
            $multiply: [
              {
                $divide: [
                  {
                    $size: {
                      $filter: {
                        input: '$attempts',
                        cond: { $eq: ['$$this.passed', true] }
                      }
                    }
                  },
                  { $size: '$attempts' }
                ]
              },
              100
            ]
          }
        }
      }
    ]);

    // Revenue from this course
    const courseRevenue = await Order.aggregate([
      { $match: { course: courseId, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    res.json({
      enrollmentStats: {
        total: totalEnrollments,
        active: activeEnrollments,
        completed: completedEnrollments
      },
      progressDistribution,
      assignmentCompletion,
      quizPerformance,
      revenue: courseRevenue[0] || { totalRevenue: 0, totalOrders: 0 }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get user management analytics
 */
exports.getUserAnalytics = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // User registration trends (last 12 months)
    const registrationTrends = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            role: '$role'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // User distribution by role
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Most active students (by enrollments)
    const activeStudents = await Enrollment.aggregate([
      {
        $group: {
          _id: '$student',
          enrollmentCount: { $sum: 1 },
          averageProgress: { $avg: '$percentageCompleted' }
        }
      },
      { $sort: { enrollmentCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          enrollmentCount: 1,
          averageProgress: { $round: ['$averageProgress', 0] }
        }
      }
    ]);

    res.json({
      registrationTrends,
      roleDistribution,
      activeStudents
    });
  } catch (err) {
    next(err);
  }
};
