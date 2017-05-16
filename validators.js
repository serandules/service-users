var validators = require('validators');
var Users = require('model-users');

exports.create = function (req, res, next) {
    validators.pre(Users, req, res, function (err) {
        if (err) {
            return next(err);
        }
        var data = req.body;
        var password = data.password;
        var validator = validators.types.password({
            blocked: {
                email: data.email
            }
        });
        validator('password', data.password, function (err) {
            if (err) {
                return res.pond(err);
            }
            next();
        });
    });
};