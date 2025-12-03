const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  lesson: { type: mongoose.Schema.Types.ObjectId, sparse: true }, // optional: link to specific lesson
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date, sparse: true },
  createdAt: { type: Date, default: Date.now }
});

// Submission subdocument
const submissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
  submissionText: String, // for text answers
  submissionLink: String, // for Google Drive links
  submittedAt: { type: Date, default: Date.now },
  grade: { type: Number, min: 0, max: 100, sparse: true },
  feedback: String,
  gradedAt: { type: Date, sparse: true },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', sparse: true }
});

// Ensure a student can only submit once per assignment
submissionSchema.index({ student: 1, assignment: 1 }, { unique: true });

const assignmentModel = mongoose.model('Assignment', assignmentSchema);
const submissionModel = mongoose.model('Submission', submissionSchema);

module.exports = { assignmentModel, submissionModel };
