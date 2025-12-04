const { assignmentModel, submissionModel } = require('../models/Assignment');
const Course = require('../models/Course');

exports.listAssignments = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const filter = {};
    if (courseId) {
      filter.course = courseId;
    }

    const assignments = await assignmentModel.find(filter).lean();
    res.json(assignments);
  } catch (err) {
    next(err);
  }
};

exports.createAssignment = async (req, res, next) => {
  try {
    const { courseId, title, description, dueDate } = req.body;
    const userId = req.user.id;

    // Verify course exists and user is instructor
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (course.instructor.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const assignment = await assignmentModel.create({
      course: courseId,
      title,
      description,
      dueDate
    });

    const populated = await assignment.populate('course', 'title');

    res.status(201).json({
      message: 'Assignment created',
      assignment: populated
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Submit assignment
 */
exports.submitAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { submissionText, submissionLink } = req.body;
    const studentId = req.user.id;

    if (!submissionText && !submissionLink) {
      return res.status(400).json({ message: 'Provide submission text or link' });
    }

    const assignment = await assignmentModel.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Check for existing submission
    const existing = await submissionModel.findOne({
      student: studentId,
      assignment: assignmentId
    });

    if (existing) {
      // Update existing submission
      existing.submissionText = submissionText;
      existing.submissionLink = submissionLink;
      existing.submittedAt = new Date();
      existing.grade = undefined; // Clear previous grade
      existing.feedback = undefined;
      await existing.save();

      res.json({
        message: 'Assignment resubmitted',
        submission: existing
      });
    } else {
      // Create new submission
      const submission = await submissionModel.create({
        student: studentId,
        assignment: assignmentId,
        submissionText,
        submissionLink
      });

      const populated = await submission.populate('student', 'name email').populate('assignment', 'title');

      res.status(201).json({
        message: 'Assignment submitted',
        submission: populated
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Get submissions for an assignment (Admin/Instructor only)
 */
exports.getAssignmentSubmissions = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const assignment = await assignmentModel.findById(assignmentId).populate('course');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Verify authorization
    if (
      assignment.course.instructor.toString() !== userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const total = await submissionModel.countDocuments({ assignment: assignmentId });
    const submissions = await submissionModel.find({ assignment: assignmentId })
      .populate('student', 'name email')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      data: submissions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Grade a submission
 */
exports.gradeSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;
    const graderId = req.user.id;

    if (grade === undefined || grade < 0 || grade > 100) {
      return res.status(400).json({ message: 'Grade must be between 0 and 100' });
    }

    const submission = await submissionModel.findById(submissionId).populate('assignment');
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    // Verify authorization
    const course = await Course.findById(submission.assignment.course);
    if (
      course.instructor.toString() !== graderId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    submission.grade = grade;
    submission.feedback = feedback;
    submission.gradedAt = new Date();
    submission.gradedBy = graderId;
    await submission.save();

    const updated = await submission.populate('student', 'name email');

    res.json({
      message: 'Submission graded',
      submission: updated
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get student's submissions for a course
 */
exports.getStudentSubmissions = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    const submissions = await submissionModel.find()
      .populate({
        path: 'assignment',
        match: { course: courseId },
        select: 'title course'
      })
      .populate('student', 'name email')
      .lean();

    // Filter out where assignment is null
    const filtered = submissions.filter(s => s.assignment !== null);

    res.json({ submissions: filtered });
  } catch (err) {
    next(err);
  }
};
