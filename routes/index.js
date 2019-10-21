const express = require('express');
const router = express.Router();
const passport = require('../passport');
const authController = require('./controllers/authController');
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const User = require('../models/User');
const Chat = require('../models/Chat');
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
    const chatUserIds = await Chat.find({ _id: { $in: req.user.chats } }).select('users');
    const chatPartners = chatUserIds.map(el => {
      const [user1, user2] = el.users;
      return req.user.id === user1 ? user2 : user1;
    });
    console.log(chatPartners);
    const users = await User.find({
      $and: [
        { _id: { $nin: [req.user._id, ...chatPartners] } },
        { dislike_users: { $nin: req.user.dislike_users } }
      ]
    }).select('-__v -email -created_at -updatedAt -mail_confirm -chats');

    const totalUserCount = users.length;

    return res.status(200).send({
      total_user_count: totalUserCount,
      users: users.slice(limit * pageIndex, limit * (pageIndex + 1))
    });
  } catch (error) {
    res.status(500).send({ message: error });
  }
});

router.get('/api/user/likes', async (req, res, next) => {
  return res.status(200).send({ likes_me: req.user.like_me });
});

router.put('/api/users/likes/:partner_id', async (req, res, next) => {
  try {
    const partnerId = req.params.partner_id;
    const userId = req.user._id;

    await User.findOneAndUpdate(
      { _id: partnerId },
      {
        $push: { like_me: userId }
      }
    );

    return res.status(200).send({ result: 'ok', message: '' });
  } catch (error) {
    return res.status(500).send({ result: 'failure', message: 'server error' });
  }
});

router.put('/api/users/unlikes/:partner_id', async (req, res, next) => {
  const partnerId = req.params.partner_id;
  const userId = req.user._id;

  try {
    await User.findOneAndUpdate(
      { _id: userId },
      {
        $push: { dislike_users: partnerId }
      }
    );

    return res.status(200).send({ result: 'ok' });
  } catch (error) {
    return res.status(500).send({ result: 'failure', message: 'server error' });
  }
});

router.get('/api/chats', async (req, res, next) => {
  const userId = req.user.id;
  const chats = await Chat.find({ _id: { $in: req.user.chats } }).populate({
    path: 'users',
    select: 'name _id profile_image'
  });

  const newChats = chats.map(obj => {
    obj._doc.partner = obj.users[0].id !== userId ? obj.users[0] : obj.users[1];
    delete obj._doc.users;

    return obj._doc;
  });

  return res.status(200).send({ chats: newChats });
});

router.post('/api/chats/:partner_id', async (req, res, next) => {
  const partnerId = req.params.partner_id;
  const userId = req.user._id;

  const newChats = await new Chat({
    users: [partnerId, userId]
  }).save();

  await User.updateMany(
    { _id: { $in: [partnerId, userId] } },
    { $push: { chats: newChats._id } },
    { multi: true }
  );

  return res.status(200).send({ chat: newChats });
});

router.get('/api/chats/:roomId', async (req, res) => {
  const roomId = req.params.roomId;
  const chat = await Chat.findOne({ _id: roomId }).populate({
    path: 'users',
    select: 'name _id profile_image'
  });

  const userId = req.user.id;

  chat._doc.partner = chat.users[0].id !== userId ? chat.users[0] : chat.users[1];
  delete chat._doc.users;

  return res.status(200).send({ chat });
});

router.put('/api/chats/:roomId', async (req, res) => {
  const roomId = req.params.roomId;
  const userId = req.user._id;

  const chat = await Chat.findOneAndUpdate(
    { _id: roomId },
    {
      $push: {
        messages: {
          content: req.body.message,
          speaker: userId
        }
      }
    }
  );

  return res.status(200).send({ chat: chat });
});

module.exports = router;
