exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();

  res.status(500).json({ message: '로그인이 되어있지 않음' });
};
