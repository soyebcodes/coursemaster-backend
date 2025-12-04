require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../src/models/User');

const email = process.argv[2] || process.env.ADMIN_EMAIL || 'soyebadmin@email.com';
const newPassword = process.argv[3] || process.env.ADMIN_PASSWORD || 'soyeb1234';

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  try {
    const user = await User.findOne({ email });
    if (user) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
      console.log(`Updated password for ${email}`);
    } else {
      const newUser = new User({ name: 'Admin', email, password: newPassword, role: 'admin' });
      await newUser.save();
      console.log(`Created new admin ${email} with provided password`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error updating/creating admin:', err);
    process.exit(1);
  } finally {
    try { await mongoose.connection.close(); } catch (e) {}
  }
}

run();
