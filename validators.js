var serandi = require('serandi');
var errors = require('errors');
var Users = require('model-users');

exports.update = function (req, res, next) {
  serandi.update(Users)(req, res, function (err) {
    if (err) {
      return next(err);
    }
    var data = req.body;
    if (data.email !== req.user.email) {
      return next(errors.forbidden());
    }
    if (!data.password) {
      return next();
    }
    serandi.otp({
      name: 'accounts-update',
      user: req.ctx.id
    })(req, res, next);
  });
};
