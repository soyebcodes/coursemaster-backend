const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

/**
 * Create a batch for a course (Admin/Instructor only)
 */
exports.createBatch = async (req, res, next) => {
  try {
    const { courseId, name, startDate, endDate, maxStudents } = req.body;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (course.instructor.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const batch = {
      _id: new mongoose.Types.ObjectId(),
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      maxStudents: maxStudents || null
    };

    course.batches.push(batch);
    await course.save();

    res.status(201).json({
      message: 'Batch created',
      batch
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all batches for a course
 */
exports.getBatches = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const course = await Course.findById(courseId).select('batches instructor');
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // If not admin/instructor, only show active batches
    if (course.instructor.toString() !== userId && req.user.role !== 'admin') {
      const now = new Date();
      const activeBatches = course.batches.filter(batch => 
        batch.startDate <= now && batch.endDate >= now
      );
      return res.json({ batches: activeBatches });
    }

    res.json({ batches: course.batches });
  } catch (err) {
    next(err);
  }
};

/**
 * Update a batch (Admin/Instructor only)
 */
exports.updateBatch = async (req, res, next) => {
  try {
    const { courseId, batchId } = req.params;
    const { name, startDate, endDate, maxStudents } = req.body;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (course.instructor.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const batch = course.batches.id(batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    if (name) batch.name = name;
    if (startDate) batch.startDate = new Date(startDate);
    if (endDate) batch.endDate = new Date(endDate);
    if (maxStudents !== undefined) batch.maxStudents = maxStudents;

    await course.save();

    res.json({
      message: 'Batch updated',
      batch
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a batch (Admin/Instructor only)
 */
exports.deleteBatch = async (req, res, next) => {
  try {
    const { courseId, batchId } = req.params;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (course.instructor.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if batch has enrollments
    const enrollmentsInBatch = await Enrollment.countDocuments({
      course: courseId,
      batch: batchId
    });

    if (enrollmentsInBatch > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete batch with existing enrollments' 
      });
    }

    course.batches.pull(batchId);
    await course.save();

    res.json({ message: 'Batch deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * Get students enrolled in a batch (Admin/Instructor only)
 */
exports.getBatchStudents = async (req, res, next) => {
  try {
    const { courseId, batchId } = req.params;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (course.instructor.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const total = await Enrollment.countDocuments({
      course: courseId,
      batch: batchId
    });

    const enrollments = await Enrollment.find({
      course: courseId,
      batch: batchId
    })
      .populate('student', 'name email')
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      data: enrollments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Enroll student in a specific batch
 */
exports.enrollInBatch = async (req, res, next) => {
  try {
    const { courseId, batchId } = req.params;
    const studentId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const batch = course.batches.id(batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    // Check if batch is active
    const now = new Date();
    if (batch.startDate > now || batch.endDate < now) {
      return res.status(400).json({ message: 'Batch is not currently active' });
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({ 
      student: studentId, 
      course: courseId 
    });
    if (existing) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // Check batch capacity
    if (batch.maxStudents) {
      const currentEnrollments = await Enrollment.countDocuments({
        course: courseId,
        batch: batchId
      });
      if (currentEnrollments >= batch.maxStudents) {
        return res.status(400).json({ message: 'Batch is full' });
      }
    }

    // Create enrollment with batch
    const { initializeProgress } = require('../utils/progressHelper');
    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      batch: batchId,
      progress: initializeProgress(course),
      percentageCompleted: 0
    });

    await enrollment.populate('course', 'title');
    await enrollment.populate('student', 'name email');

    res.status(201).json({
      message: 'Successfully enrolled in batch',
      enrollment
    });
  } catch (err) {
    next(err);
  }
};
