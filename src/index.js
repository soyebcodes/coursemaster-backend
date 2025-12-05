require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.route.js');
const courseRoutes = require('./routes/courses.route.js');
const enrollmentRoutes = require('./routes/enrollment.route.js');
const adminRoutes = require('./routes/admin.route.js');
const assignmentRoutes = require('./routes/assignment.route.js');
const quizRoutes = require('./routes/quiz.route.js');
const adminEnrollmentRoutes = require('./routes/adminEnrollment.route.js');
const paymentRoutes = require('./routes/payment.route.js');
const batchRoutes = require('./routes/batch.route.js');
const analyticsRoutes = require('./routes/analytics.route.js');
const userManagementRoutes = require('./routes/userManagement.route.js');
const errorHandler = require('./middlewares/error.middleware.js');

const app = express();

// middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/students/enrollments', enrollmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/admin/enrollments', adminEnrollmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin/users', userManagementRoutes);

// health check
app.get('/health', (req, res) => res.json({ ok: true }));

// global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI not defined in .env');
}

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Mongo connected');
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
  } catch (err) {
    console.error('Mongo connection error', err);
    process.exit(1);
  }
}

startServer();
// graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongo connection closed');
  process.exit(0);
});