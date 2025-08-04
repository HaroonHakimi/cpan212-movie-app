const Movie = require('../models/Movie');

function ensureAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login');
}

async function ensureOwner(req, res, next) {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).send('Movie not found');
    if (movie.user.toString() !== req.session.user._id) {
      return res.status(403).send('Forbidden');
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { ensureAuth, ensureOwner }; 