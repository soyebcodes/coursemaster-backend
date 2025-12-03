require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.route.js');
const courseRoutes = require('./routes/courses.route.js');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);

// health check
app.get('/health', (req, res) => res.json({ ok: true }));

// global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI not defined in .env');
}

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
})
.then(() => {
  console.log('Mongo connected');
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
})
.catch(err => {
  console.error('Mongo connection error', err);
  process.exit(1);
});

// graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongo connection closed');
  process.exit(0);
});