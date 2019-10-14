const express = require('express');
const Keygrip = require('keygrip');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const logger = require('morgan');
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

const passport = require('./passport');
const indexRouter = require('./routes/index');

const app = express();

if (process.env.NODE_ENV === 'development') {
  require('dotenv').config();
}

mongoose.connect(process.env.DATABASE_URI, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true
});

app.use(
  cookieSession({
    name: 'session',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    keys: new Keygrip(['key1', 'key2'], 'SHA384', 'base64'),
    httpOnly: true
  })
);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => console.log('connection'));

/* AWS.config.update({
  accessKeyId: process.env.AWS_ACCESSKEYID,
  secretAccessKey: process.env.AWS_SECRETACCESSKEY,
  region: 'ap-northeast-2'
});

const s3 = new AWS.S3();

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'mbti-match',
    metadata: function(req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function(req, file, cb) {
      cb(null, Date.now().toString());
    }
  })
});*/

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));

// req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);

// app.upload = upload;

// catch 404 and forward to error handler
/*app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});*/

module.exports = app;
