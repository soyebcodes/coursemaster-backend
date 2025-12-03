const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  title: String,
  videoUrl: String,
  content: String,
  order: Number
});

const batchSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  startDate: Date,
  endDate: Date
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, text: true },
  description: { type: String, text: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  price: { type: Number, default: 0, index: true },
  category: { type: String, index: true },
  tags: [String],
  lessons: [lessonSchema],
  batches: [batchSchema],
  createdAt: { type: Date, default: Date.now }
});

courseSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Course', courseSchema);
