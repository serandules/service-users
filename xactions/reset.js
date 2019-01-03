var _ = require('lodash');
var errors = require('errors');
var serandi = require('serandi');
var model = require('model');
var Users = require('model-users');

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
      name: 'accounts-recovery',
      user: req.params.id
    })(req, res, next);
  });

  route.use(function (req, res, next) {
    var user = req.user;
    req.body = _.defaults(req.body, user.toObject());
    next();
  });

  route.use(serandi.update(Users));

  route.use(function (req, res, next) {
    model.update(req.ctx, function (err, user) {
      if (err) {
        return next(err);
      }
      res.status(204).end();
    });
  });
};
