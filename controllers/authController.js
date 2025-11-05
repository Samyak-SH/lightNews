const bcrypt = require('bcrypt');
const { User } = require('../models/User');
const { signToken } = require('../utils/jwt');


exports.register = async (req, res) => {
  try {
    const { userId, password } = req.body || {};
    if (!userId || !password) return res.status(400).json({ error: 'userId & password required' });


    const exists = await User.findById(userId);
    if (exists) return res.status(400).json({ error: 'User already exists' });


    const hash = await bcrypt.hash(password, 10);
    await User.create({ _id: userId, password: hash });


    const token = signToken({ userId });
    res.json({ userId, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'register failed' });
  }
};


exports.login = async (req, res) => {
  try {
    const { userId, password } = req.body || {};
    if (!userId || !password) return res.status(400).json({ error: 'userId & password required' });


    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ error: 'User not found' });


    const ok = await bcrypt.compare(password, user.password || '');
    if (!ok) return res.status(401).json({ error: 'Wrong password' });


    const token = signToken({ userId });
    res.json({ userId, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'login failed' });
  }
};