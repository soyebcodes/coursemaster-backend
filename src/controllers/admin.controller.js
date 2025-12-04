const Course = require('../models/Course');
const mongoose = require('mongoose');

/**
 * Create a new course (Admin only)
 */
exports.createCourse = async (req, res, next) => {
  try {
    const { title, description, price, category, tags, lessons, batches } = req.body;
    const instructorId = req.user.id; // Admin/Instructor creating the course

    // Prepare lessons with proper ObjectIds
    const processedLessons = (lessons || []).map((lesson, idx) => ({
      _id: new mongoose.Types.ObjectId(),
      title: lesson.title,
      videoUrl: lesson.videoUrl,
      content: lesson.content,
      order: lesson.order || idx + 1
    }));

    // Prepare batches with proper ObjectIds
    const processedBatches = (batches || []).map(batch => ({
      _id: new mongoose.Types.ObjectId(),
      name: batch.name,
      startDate: batch.startDate,
      endDate: batch.endDate
    }));

    const course = await Course.create({
      title,
      description,
      instructor: instructorId,
      price: price || 0,
      category,
      tags: tags || [],
      lessons: processedLessons,
      batches: processedBatches
    });

    const populated = await course.populate('instructor', 'name email');

    res.status(201).json({
      message: 'Course created successfully',
      course: populated
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update a course (Admin only)
 */
exports.updateCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, description, price, category, tags, lessons, batches } = req.body;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Verify authorization (instructor of the course or admin)
    if (
      course.instructor.toString() !== userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }

    // Update fields
    if (title) course.title = title;
    if (description) course.description = description;
    if (price !== undefined) course.price = price;
    if (category) course.category = category;
    if (tags) course.tags = tags;

    // Update lessons (careful with existing lessons)
    if (lessons) {
      course.lessons = lessons.map((lesson, idx) => ({
        _id: lesson._id || new mongoose.Types.ObjectId(),
        title: lesson.title,
        videoUrl: lesson.videoUrl,
        content: lesson.content,
        order: lesson.order || idx + 1
      }));
    }

    // Update batches
    if (batches) {
      course.batches = batches.map(batch => ({
        _id: batch._id || new mongoose.Types.ObjectId(),
        name: batch.name,
        startDate: batch.startDate,
        endDate: batch.endDate
      }));
    }

    await course.save();
    const updated = await course.populate('instructor', 'name email');

    res.json({
      message: 'Course updated successfully',
      course: updated
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a course (Admin only)
 */
exports.deleteCourse = async (req, res, next) => {
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
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }

    // Delete related enrollments, assignments, quizzes
    const Enrollment = require('../models/Enrollment');
    const { assignmentModel } = require('../models/Assignment');
    const { quizModel } = require('../models/Quiz');

    await Enrollment.deleteMany({ course: courseId });
    await assignmentModel.deleteMany({ course: courseId });
    await quizModel.deleteMany({ course: courseId });

    await Course.findByIdAndDelete(courseId);

    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * Get course details (for admin editing)
 */
exports.getCourseForEdit = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).populate('instructor', 'name email');
    if (!course) return res.status(404).json({ message: 'Course not found' });

    res.json({ course });
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
    const Enrollment = require('../models/Enrollment');
    
    const totalCourses = await Course.countDocuments();
    const totalUsers = await User.countDocuments();
    const studentCount = await User.countDocuments({ role: 'student' });
    const instructorCount = await User.countDocuments({ role: 'instructor' });
    const adminCount = await User.countDocuments({ role: 'admin' });
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
      adminCount,
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
