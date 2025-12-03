const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

/**
 * Calculate enrollment progress as percentage
 */
const calculateProgress = (enrollment) => {
  if (!enrollment.progress || enrollment.progress.length === 0) return 0;
  const completed = enrollment.progress.filter(p => p.completed).length;
  return Math.round((completed / enrollment.progress.length) * 100);
};

/**
 * Initialize progress array for a course
 */
const initializeProgress = (course) => {
  if (!course.lessons || course.lessons.length === 0) return [];
  return course.lessons.map(lesson => ({
    lessonId: lesson._id,
    completed: false
  }));
};

module.exports = { calculateProgress, initializeProgress };
