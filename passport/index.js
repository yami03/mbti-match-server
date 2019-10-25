const passport = require('passport');
const User = require('../models/User');
const SigninStrategy = require('./SigninStrategy');
const SignupStrategy = require('./SignupStrategy');

passport.serializeUser((user, done) => {
  done(null, user.email);
});

passport.deserializeUser(async (email, done) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return done(new Error('가입되지 않은 회원입니다.'));
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
});

passport.use('local-signin', SigninStrategy);
passport.use('local-signup', SignupStrategy);

module.exports = passport;
