const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const mbtiRelationDiagram = require('../lib/mbti.json');

const salt = bcrypt.genSaltSync(10);

const SignupStrategy = new LocalStrategy(
  {
    passReqToCallback: true,
    usernameField: 'email',
    passwordField: 'password'
  },
  async (req, email, password, done) => {
    const { mbti, name, description, location } = req.body;

    try {
      const user = await User.findOne({ email });
      if (user) return done('이미 있는 회원입니다.', user);

      const encryptedPassword = bcrypt.hashSync(password, salt);
      const mbtiData = mbtiRelationDiagram.find(obj => obj.type === mbti);

      const newUser = await new User({
        password: encryptedPassword,
        mbti: mbtiData,
        name,
        email,
        description,
        location
      }).save();

      done(null, newUser);
    } catch (error) {
      done(error, null);
    }
  }
);

module.exports = SignupStrategy;
