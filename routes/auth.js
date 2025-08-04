const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// GET /register - show registration form
router.get('/register', (req, res) => {
  res.render('auth/register', { errors: null, user: {} });
});

// POST /register - handle registration
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const errors = [];
  if (!username) errors.push({ msg: 'Username is required' });
  if (!password || password.length < 4) errors.push({ msg: 'Password must be at least 4 characters' });
  if (errors.length) {
    return res.render('auth/register', { errors, user: { username } });
  }
  try {
    const existing = await User.findOne({ username });
    if (existing) {
      return res.render('auth/register', { errors: [{ msg: 'Username already taken' }], user: { username } });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed });
    await user.save();
    req.session.user = { _id: user._id.toString(), username: user.username };
    res.redirect('/');
  } catch (err) {
    res.render('auth/register', { errors: [{ msg: 'Error registering user' }], user: { username } });
  }
});

// GET /login - show login form
router.get('/login', (req, res) => {
  res.render('auth/login', { errors: null, user: {} });
});

// POST /login - handle login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const errors = [];
  if (!username) errors.push({ msg: 'Username is required' });
  if (!password) errors.push({ msg: 'Password is required' });
  if (errors.length) {
    return res.render('auth/login', { errors, user: { username } });
  }
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.render('auth/login', { errors: [{ msg: 'Invalid username or password' }], user: { username } });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('auth/login', { errors: [{ msg: 'Invalid username or password' }], user: { username } });
    }
    req.session.user = { _id: user._id.toString(), username: user.username };
    res.redirect('/');
  } catch (err) {
    res.render('auth/login', { errors: [{ msg: 'Error logging in' }], user: { username } });
  }
});

// POST /logout - handle logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
