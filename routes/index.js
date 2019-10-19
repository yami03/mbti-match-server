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
      const { password, __v, created_at, updatedAt, ...newUser } = copyUser;

      return res.status(200).send({ user: newUser, isAuthenticated: true, message: '' });
    });
  })(req, res, next);
});

router.get('/api/auth/user', async (req, res, next) => {
  if (req.isAuthenticated()) {
    const { password, __v, created_at, updatedAt, ...newUser } = JSON.parse(
      JSON.stringify(req.user._doc)
    );

    return res.status(200).send({ user: newUser, isAuthenticated: true });
  }
  res.status(200).send({ isAuthenticated: false });
});

router.get('/api/users', async (req, res, next) => {
  try {
    if (req.query.limit && isNaN(Number(req.query.limit))) {
      res.status(400).send({
        message: 'Invalid limit parameter'
      });

      return;
    }

    const limit = req.query.limit ? Number(req.query.limit) : 10;

    if (req.query.pageIndex && isNaN(Number(req.query.pageIndex))) {
      res.status(400).send({
        message: 'Invalid pageIndex parameter'
      });

      return;
    }

    const pageIndex = req.query.pageIndex ? Number(req.query.pageIndex) : 0;
    const users = await User.find({ _id: { $ne: req.user._id } }).select(
      '-__v -email -created_at -updatedAt -mail_confirm -chats'
    );

    const totalUserCount = users.length;

    return res.status(200).send({
      total_user_count: totalUserCount,
      users: users.slice(limit * pageIndex, limit * (pageIndex + 1))
    });
  } catch (error) {
    res.status(500).send({ message: 'server error' });
  }
});

router.get('/api/user/likes', async (req, res, next) => {
  return res.status(200).send({ likes_me: req.user.like_me });
});

router.put('/api/users/likes/:partner_id', async (req, res, next) => {
  try {
    const partnerId = req.params.partner_id;
    const useId = req.user._id;

    await User.findOneAndUpdate(
      { _id: partnerId },
      {
        $push: { like_me: useId }
      }
    );

    return res.status(200).send({ result: 'ok', message: '' });
  } catch (error) {
    return res.status(500).send({ result: 'failure', message: 'server error' });
  }
});

router.put('/api/users/unlikes/:partner_id', async (req, res, next) => {
  const partnerId = req.params.partner_id;
  const useId = req.user._id;

  try {
    await User.findOneAndUpdate(
      { _id: useId },
      {
        $push: { dislike_users: partnerId }
      }
    );

    return res.status(200).send({ result: 'ok' });
  } catch (error) {
    return res.status(500).send({ result: 'failure', message: 'server error' });
  }
});

module.exports = router;
