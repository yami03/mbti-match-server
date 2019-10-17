const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const signinStrategy = new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password' // TODO
  },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ email }).select('+password');

      if (user) {
        bcrypt.compare(password, user.password, (err, res) => {
          if (res) return done(null, user);

          return done('비밀번호가 일치하지 않습니다.', null);
        });
      } else {
        return done('가입되지 않은 회원입니다.', null);
      }
    } catch (error) {
      done(error);
    }
  }
);

module.exports = signinStrategy;
