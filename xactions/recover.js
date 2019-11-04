var async = require('async');
var fs = require('fs');
var path = require('path');
var dust = require('dustjs-linkedin');
var util = require('util');
var utils = require('utils');
var serandi = require('serandi');
var messenger = require('messenger');
var model = require('model');
var Users = require('model-users');
var Otps = require('model-otps');

var template = function (name) {
  var data = fs.readFileSync(path.join(__dirname, '..', 'templates', name + '.html'));
  dust.loadSource(dust.compile(String(data), 'service-users-' + name));
};

template('recover');

var recover = function (user, done) {
  Otps.remove({
    user: user.id,
    name: 'accounts-update'
  }, function (err) {
    if (err) {
      return done(err);
    }
    model.create({
      user: user,
      model: Otps,
      data: {
        name: 'accounts-update'
      },
      overrides: {}
    }, function (err, otp) {
      if (err) {
        return done(err);
      }
      var ctx = {
        user: user,
        title: 'Welcome',
        reset: utils.resolve(util.format('accounts:///reset?user=%s&email=%s&otp=%s', user.id, user.email, otp.value))
      };
      dust.render('service-users-recover', ctx, function (err, html) {
        if (err) {
          return done(err);
        }
        messenger.email({
          from: 'Serandives <no-reply@serandives.com>',
          to: user.email,
          subject: ctx.title,
          html: html,
          text: html
        }, done);
      });
    });
  });
};

module.exports = function (route) {
  route.use(serandi.json);
  route.use(serandi.captcha);
  route.use(serandi.query);

  route.use(function (req, res, next) {
    req.ctx.previleged = true;
    next();
  });

  route.use(serandi.find(Users));

  route.use(function (req, res, next) {
    var ctx = req.ctx;
    ctx.search.count = 1;
    next();
  });

  route.use(function (req, res, next) {
    model.find(req.ctx, function (err, users, paging) {
      if (err) {
        return next(err);
      }
      async.each(users, function (user, recovered) {
        recover(user, recovered);
      }, function (err) {
        if (err) {
          return next(err);
        }
        res.status(204).end();
      });
    });
  });
};
