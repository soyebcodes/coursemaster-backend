const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  _id: false,
  text: String,
  isCorrect: Boolean
});

const questionSchema = new mongoose.Schema({
  _id: false,
  question: String,
  options: [optionSchema],
  explanation: String // shown after submission
});

const quizSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  lesson: { type: mongoose.Schema.Types.ObjectId, sparse: true }, // optional: link to specific lesson
  title: { type: String, required: true },
  description: String,
  questions: [questionSchema],
  passingScore: { type: Number, default: 60, min: 0, max: 100 },
  createdAt: { type: Date, default: Date.now }
});

const attemptSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  answers: [
    {
      _id: false,
      questionIndex: Number,
      selectedOption: String
    }
  ],
  score: { type: Number, min: 0, max: 100 },
  passed: Boolean,
  attemptedAt: { type: Date, default: Date.now }
});

// Ensure we track all attempts for a student on a quiz
attemptSchema.index({ student: 1, quiz: 1 });

const quizModel = mongoose.model('Quiz', quizSchema);
const attemptModel = mongoose.model('QuizAttempt', attemptSchema);

module.exports = { quizModel, attemptModel };
