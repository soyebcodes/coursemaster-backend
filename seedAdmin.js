require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function seed() {
  try {
    // ✅ No need for useNewUrlParser / useUnifiedTopology in Mongoose v6+
    await mongoose.connect(process.env.MONGODB_URI);

    const adminEmail = 'admin@coursemaster.local';
    const exists = await User.findOne({ email: adminEmail });

    if (exists) {
      console.log('Admin already exists:', adminEmail);
      process.exit(0);
    }

    const admin = new User({
      name: 'Admin',
      email: adminEmail,
      password: 'ChangeMe123!', // ⚠️ Consider hashing before saving
      role: 'admin'
    });

    await admin.save();
    console.log('Admin created:', adminEmail, 'password: ChangeMe123!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();