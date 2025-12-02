require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// health
app.get('/health', (req,res) => res.json({ ok: true }));


const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI)
.then(()=> {
  console.log('Mongo connected');
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
})
.catch(err => {
  console.error('Mongo connection error', err);
  process.exit(1);
});
