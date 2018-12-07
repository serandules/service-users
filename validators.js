var serandi = require('serandi');

exports.update = function (req, res, next) {
  var data = req.body;
  if (!data.password) {
    return next();
  }
  serandi.otp({
    name: 'accounts-update',
    user: req.ctx.id
  })(req, res, next);
};