const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const { ensureAuth, ensureOwner } = require('../utils/auth');

// GET /movies/add - show add movie form
router.get('/add', ensureAuth, (req, res) => {
  res.render('movies/add', { errors: null, movie: {}, user: req.session.user });
});

// POST /movies/add - handle add movie
router.post('/add', ensureAuth, async (req, res) => {
  const { name, description, year, genres, rating } = req.body;
  const errors = [];
  if (!name) errors.push({ msg: 'Name is required' });
  if (!description) errors.push({ msg: 'Description is required' });
  if (!year || isNaN(year)) errors.push({ msg: 'Valid year is required' });
  if (!genres) errors.push({ msg: 'At least one genre is required' });
  if (rating === undefined || rating === '' || isNaN(rating) || rating < 0 || rating > 10) errors.push({ msg: 'Rating must be between 0 and 10' });
  if (errors.length) {
    return res.render('movies/add', {
      errors,
      movie: { name, description, year, genres: genres.split(',').map(g => g.trim()), rating },
      user: req.session.user
    });
  }
  try {
    const movie = new Movie({
      name,
      description,
      year,
      genres: genres.split(',').map(g => g.trim()),
      rating,
      user: req.session.user._id
    });
    await movie.save();
    res.redirect('/');
  } catch (err) {
    res.render('movies/add', { errors: [{ msg: 'Error saving movie' }], movie: req.body, user: req.session.user });
  }
});

// GET /movies/:id - show movie details
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).populate('user', 'username');
    if (!movie) return res.status(404).render('error', { message: 'Movie not found', error: {} });
    res.render('movies/details', { movie, user: req.session.user });
  } catch (err) {
    res.status(500).render('error', { message: 'Error fetching movie', error: err });
  }
});

// GET /movies/:id/edit - show edit form
router.get('/:id/edit', ensureAuth, ensureOwner, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).render('error', { message: 'Movie not found', error: {} });
    res.render('movies/edit', { errors: null, movie, user: req.session.user });
  } catch (err) {
    res.status(500).render('error', { message: 'Error fetching movie', error: err });
  }
});

// POST /movies/:id/edit - handle edit
router.post('/:id/edit', ensureAuth, ensureOwner, async (req, res) => {
  const { name, description, year, genres, rating } = req.body;
  const errors = [];
  if (!name) errors.push({ msg: 'Name is required' });
  if (!description) errors.push({ msg: 'Description is required' });
  if (!year || isNaN(year)) errors.push({ msg: 'Valid year is required' });
  if (!genres) errors.push({ msg: 'At least one genre is required' });
  if (rating === undefined || rating === '' || isNaN(rating) || rating < 0 || rating > 10) errors.push({ msg: 'Rating must be between 0 and 10' });
  if (errors.length) {
    return res.render('movies/edit', {
      errors,
      movie: { _id: req.params.id, name, description, year, genres: genres.split(',').map(g => g.trim()), rating },
      user: req.session.user
    });
  }
  try {
    await Movie.findByIdAndUpdate(req.params.id, {
      name,
      description,
      year,
      genres: genres.split(',').map(g => g.trim()),
      rating
    });
    res.redirect(`/movies/${req.params.id}`);
  } catch (err) {
    res.render('movies/edit', { errors: [{ msg: 'Error updating movie' }], movie: req.body, user: req.session.user });
  }
});

// POST /movies/:id/delete - handle delete (AJAX)
router.post('/:id/delete', ensureAuth, ensureOwner, async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    res.redirect('/');
  } catch (err) {
    res.status(500).render('error', { message: 'Error deleting movie', error: err });
  }
});

module.exports = router; 