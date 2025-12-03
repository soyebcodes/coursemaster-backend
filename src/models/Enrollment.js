const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  lessonId: mongoose.Schema.Types.ObjectId,
  completed: { type: Boolean, default: false },
  completedAt: Date
});

const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', sparse: true },
  enrolledAt: { type: Date, default: Date.now },
  progress: [progressSchema], // tracks completed lessons
  percentageCompleted: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'completed', 'dropped'], default: 'active' }
});

// Ensure a student can only enroll once per course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
