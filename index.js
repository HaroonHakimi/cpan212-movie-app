require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

const app = express();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:admin123@cluster0.njdz2nl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Middleware
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb+srv://admin:admin123@cluster0.njdz2nl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  }),
}));

// Routes
const movieRoutes = require('./routes/movies');
const authRoutes = require('./routes/auth');

app.use('/', authRoutes);
app.use('/movies', movieRoutes);

// Home page
const Movie = require('./models/Movie');
app.get('/', async (req, res) => {
  try {
    const movies = await Movie.find().populate('user', 'username').sort({ createdAt: -1 });
    res.render('index', { user: req.session.user, movies });
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.render('index', { user: req.session.user, movies: [], error: 'Failed to load movies' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500);
  res.render('error', { message: err.message, error: process.env.NODE_ENV === 'production' ? {} : err });
});

// Export the Express app for Vercel
module.exports = app;

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}