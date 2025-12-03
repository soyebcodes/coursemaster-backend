require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function seed(){
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser:true, useUnifiedTopology:true });
    const adminEmail = 'admin@coursemaster.local';
    const exists = await User.findOne({ email: adminEmail });
    if (exists) {
      console.log('Admin already exists:', adminEmail);
      process.exit(0);
    }
    const admin = new User({ name: 'Admin', email: adminEmail, password: 'ChangeMe123!', role: 'admin' });
    await admin.save();
    console.log('Admin created:', adminEmail, 'password: ChangeMe123!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
seed();
