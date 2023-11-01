const dotenv = require('dotenv').config();
const cors = require('cors');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
mongoose.set('runValidators', true);
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.connection.once('open', () => {
  console.log("Well done! , connected with mongoDB database");
}).on('error', error => {
  console.log("Oops! database connection error:" + error);
});
const adminpaths = [
  { pathUrl: '/login', routeFile: 'login' },
  { pathUrl: '/updatepassword', routeFile: 'updatepassword'},
  { pathUrl: '/user', routeFile: 'user'},
  { pathUrl: '/test', routeFile: 'test'},
]
adminpaths.forEach((adminPath) => {
  app.use('/admin' + adminPath.pathUrl, require('./routes/admin/' + adminPath.routeFile));
});
const userpaths = [
  { pathUrl: '/register', routeFile: 'register' },
  { pathUrl: '/login', routeFile: 'login' },
  { pathUrl: '/media', routeFile: 'media' },
  { pathUrl: '/card', routeFile: 'card'},
  { pathUrl: '/profile', routeFile: 'profile'}
];
userpaths.forEach((userPath) => {
  app.use('/user' + userPath.pathUrl, require('./routes/users/' + userPath.routeFile));
});
app.use(function (req, res, next) {
  next(createError(404));
});
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;
