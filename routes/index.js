const express = require('express');
const router = express.Router();
const passport = require('../passport');
const authController = require('./controllers/authController');
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const User = require('../models/User');
require('dotenv').config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESSKEYID,
  secretAccessKey: process.env.AWS_SECRETACCESSKEY,
  region: 'ap-northeast-2'
});

const s3 = new AWS.S3();

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'mbti-match',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function(req, file, cb) {
      cb(null, `${Date.now().toString()}${file.originalname}`);
    },
    acl: 'public-read-write'
  })
});

router.post('/api/upload', upload.single('file'), async (req, res, next) => {
  await User.findOneAndUpdate({ _id: req.user._id }, { profile_image: req.file.location });
  req.user.profile_image = req.file.location;

  const copyUser = JSON.parse(JSON.stringify(req.user._doc));
  const { password, __v, _id, created_at, updatedAt, ...newUser } = copyUser;

  res.status(201).send({ user: newUser, isAuthenticated: true });
});

router.post('/api/signup', (req, res, next) => {
  passport.authenticate('local-signup', function(error, user, info) {
    if (error) {
      return res.status(500).json({
        message: error
      });
    }

    req.logIn(user, error => {
      if (error) {
        return res.status(500).json({
          message: error
        });
      }

      const copyUser = JSON.parse(JSON.stringify(req.user._doc));
      const { password, __v, created_at, updatedAt, ...newUser } = copyUser;

      return res.status(201).send({ user: newUser, isAuthenticated: true });
    });
  })(req, res, next);
});

router.post('/api/login', (req, res, next) => {
  req.session = null;
  passport.authenticate('local-signin', function(error, user, info) {
    if (error) {
      return res.status(500).send({
        message: error
      });
    }

    req.logIn(user, error => {
      if (error) {
        return res.status(500).send({
          message: error
        });
      }

      const copyUser = JSON.parse(JSON.stringify(user._doc));
      const { password, __v, _id, created_at, updatedAt, ...newUser } = copyUser;

      return res.status(200).send({ user: newUser, isAuthenticated: true, message: '' });
    });
  })(req, res, next);
});

router.get('/api/auth/user', async (req, res, next) => {
  if (req.isAuthenticated()) {
    const { password, __v, _id, created_at, updatedAt, ...newUser } = JSON.parse(
      JSON.stringify(req.user._doc)
    );

    return res.status(200).send({ user: newUser, isAuthenticated: true });
  }
  res.status(200).send({ isAuthenticated: false });
});

module.exports = router;
