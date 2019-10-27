const express = require('express');
const Keygrip = require('keygrip');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const logger = require('morgan');

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
  cors({
    allowedHeaders: ['session', 'Content-Type'],
    exposedHeaders: ['session'],
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    credentials: true
  })
);

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

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);

module.exports = app;
