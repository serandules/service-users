var validators = require('validators');
var Users = require('model-users');
var serandi = require('serandi');

exports.find = function (req, res, next) {
    validators.query(req, res, function (err) {
        if (err) {
            return next(err);
        }
        validators.find({
            model: Users
        }, req, res, next);
    });
};

exports.update = function (req, res, next) {
    serandi.otp(req, res, function (err) {
      if (err) {
        return next(err);
      }
      validators.update({
        id: req.params.id,
        model: Users
      }, req, res, next);
    });
};

exports.create = function (req, res, next) {
  validators.create({
    content: 'json',
    model: Users
  }, req, res, next);
};

exports.createk = function (req, res, next) {
  var data = req.body;
  var validator = validators.types.password({
    blocked: {
      email: data.email
    }
  });
  validator({
    field: 'password',
    value: data.password
  }, function (err) {
    if (err) {
        console.log(err)
      return next(err);
    }
    validators.create({
      content: 'json',
      model: Users
    }, req, res, function (err) {
      if (err) {
        return res.pond(err)
      }
      next()
    });
  });
};