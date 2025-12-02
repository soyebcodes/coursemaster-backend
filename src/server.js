require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/courses.routes');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);

// health
app.get('/health', (req,res) => res.json({ ok: true }));

// global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(()=> {
  console.log('Mongo connected');
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
})
.catch(err => {
  console.error('Mongo connection error', err);
  process.exit(1);
});
