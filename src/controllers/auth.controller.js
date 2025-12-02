const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

exports.register = async (req,res,next) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if(exists) return res.status(400).json({ message: 'Email already in use' });
    const user = await User.create({ name, email, password, role });
    const token = signToken(user);
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
  } catch(err){ next(err); }
};

exports.login = async (req,res,next) => {
  try {
    const { email, password } = req.body;
    if(!email || !password) return res.status(400).json({ message: 'Provide email and password' });
    const user = await User.findOne({ email });
    if(!user) return res.status(401).json({ message: 'Invalid credentials' });
    const isMatch = await user.comparePassword(password);
    if(!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    const token = signToken(user);
    // optionally set httpOnly cookie:
    // res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
  } catch(err){ next(err); }
};

exports.me = async (req,res,next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user });
  } catch(err){ next(err); }
};
