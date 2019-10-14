const express = require('express');
const router = express.Router();
const passport = require('../passport');
const mbtiRelationDiagram = require('../lib/mbti.json');
const authController = require('./controllers/authController');

/* GET home page. */
router.post('/api/signup', (req, res, next) => {
  passport.authenticate('local-signup', function(error, user, info) {
    if (error) {
      return res.status(500).json({
        message: error
      });
    }

    // TODO Password remove
    req.logIn(user, error => {
      if (error) {
        return res.status(500).json({
          message: error
        });
      }

      user.isAuthenticated = true;
      return res.send({ user, isAuthenticated: true });
    });

    //return res.json(user);
  })(req, res, next);
});

router.post('/api/login', (req, res, next) => {
  passport.authenticate('local-signin', function(error, user, info) {
    if (error) {
      return res.status(500).json({
        message: error
      });
    }

    // TODO Password remove
    req.logIn(user, error => {
      if (error) {
        return res.status(500).json({
          message: error
        });
      }

      user.isAuthenticated = true;
      return res.send({ user, isAuthenticated: true });
    });
    //return res.json(user);
  })(req, res, next);
});

router.post('/logout', (req, res, next) => {
  console.log(req.body);
});

module.exports = router;
