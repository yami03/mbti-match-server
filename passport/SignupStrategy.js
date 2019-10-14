const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const salt = bcrypt.genSaltSync(10);

const SignupStrategy = new LocalStrategy(
  {
    passReqToCallback: true,
    usernameField: 'email',
    passwordField: 'password' // TODO
  },
  async (req, email, password, done) => {
    const { mbti, name } = req.body;

    //const user = await User.findOne({ email });
    try {
      const user = await User.findOne({ email });
      if (user) return done('이미 있는 회원입니다.', user);

      const encryptedPassword = bcrypt.hashSync(password, salt);
      const newUser = await new User({
        email,
        password: encryptedPassword,
        mbti,
        name
      }).save();

      delete newUser.password; // TODO

      done(null, newUser);
    } catch (error) {
      done(error, null);
    }
  }
);

module.exports = SignupStrategy;
