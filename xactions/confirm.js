var _ = require('lodash');
var errors = require('errors');
var serandi = require('serandi');
var model = require('model');
var validators = require('../validators');

module.exports = function (route) {
  route.use(function (req, res, next) {
    req.ctx.previleged = true;
    next();
  });

  route.use(function (req, res, next) {
    if (!req.user) {
      return next(errors.unauthorized());
    }
    serandi.otp({
      name: 'accounts-confirm',
      user: req.user.id
    })(req, res, next);
  });

  route.use(function (req, res, next) {
    var user = req.user.toJSON();
    delete user.password;
    req.body = user;
    next();
  });

  route.use(validators.update);

  route.use(function (req, res, next) {
    model.update(req.ctx, function (err, user) {
      if (err) {
        return next(err);
      }
      res.status(204).end();
    });
  });
};
