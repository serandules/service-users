var errors = require('errors');
var validators = require('validators');

exports.create = function (req, res, next) {
    validators.json(req, res, function (err) {
        if (err) {
            return next(err);
        }
        var data = req.body;
        var email = data.email;
        if (!email) {
            return res.pond(errors.unprocessableEntiy('Email address needs to be specified.'));
        }
        var at = email.indexOf('@');
        var dot = email.lastIndexOf('.');
        if (at === -1 || dot === -1 || dot < at) {
            return res.pond(errors.unprocessableEntiy('Invalid email address format.'));
        }
        var password = data.password;
        if (!password) {
            return res.pond(errors.unprocessableEntiy('Password needs to be specified.'));
        }
        if (password.length < 6) {
            return res.pond(errors.unprocessableEntiy('Password should at least be 6 characters.'));
        }
        if (password.toLowerCase() === email.toLowerCase()) {
            return res.pond(errors.unprocessableEntiy('Password should not be equivalent to the email.'));
        }
        if (!/[0-9]/.test(password)) {
            return res.pond(errors.unprocessableEntiy('Password should contain at least one number.'));
        }
        if (!/[a-z]/.test(password)) {
            return res.pond(errors.unprocessableEntiy('Password should contain at one lower case letter.'));
        }
        if (!/[A-Z]/.test(password)) {
            return res.pond(errors.unprocessableEntiy('Password should contain at one upper case letter.'));
        }
        next();
    });
};