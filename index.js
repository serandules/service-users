var log = require('logger')('user-service');
var express = require('express');
var bodyParser = require('body-parser');

var errors = require('errors');
var utils = require('utils');
var mongutils = require('mongutils');
var auth = require('auth');
var throttle = require('throttle');
var serandi = require('serandi');
var Users = require('model-users');

var validators = require('./validators');
var sanitizers = require('./sanitizers');

// TODO: validate email address updates through PUT. i.e. switching to a new email address should re-validate the email for ownership
module.exports = function (router) {
    router.use(serandi.many);
    router.use(serandi.ctx);
    router.use(auth({
        GET: [
            '^\/$',
            '^\/([\/].*|$)'
        ],
        POST: [
            '^\/$',
            '^\/([\/].*|$)'
        ]
    }));
    router.use(throttle.apis('users'));
    router.use(bodyParser.json());

    /**
     * { "email": "ruchira@serandives.com", "password": "mypassword" }
     */
    // TODO: sync up all vehicles changes with other modules
    router.post('/', serandi.captcha, validators.create, sanitizers.create, function (req, res) {
        Users.create(req.body, function (err, user) {
            if (err) {
                if (err.code === mongutils.errors.DuplicateKey) {
                    return res.pond(errors.conflict());
                }
                log.error('users:create', err);
                return res.pond(errors.serverError());
            }
            var permissions = user.permissions;
            permissions.push({
              user: user.id,
              actions: ['read', 'update', 'delete']
            });
            Users.findOneAndUpdate({_id: user.id}, {
                permissions: permissions
            }, {new: true}).exec(function (err, user) {
                if (err) {
                    log.error('users:find-one-and-update', err);
                    return res.pond(errors.serverError());
                }
                res.locate(user.id).status(201).send(user);
            });
        });
    });

    /**
     * /users/51bfd3bd5a51f1722d000001
     */
    router.get('/:id', function (req, res) {
        var id = req.params.id;
        if (!mongutils.objectId(id)) {
            return res.pond(errors.notFound());
        }
        if (!req.token || !req.user || (req.user.id !== id)) {
            return res.pond(errors.unauthorized());
        }
        Users.findOne({
            _id: id
        }).exec(function (err, user) {
            if (err) {
                log.error('users:find-one', err);
                return res.pond(errors.serverError());
            }
            if (!user) {
                return res.pond(errors.notFound())
            }
            var name;
            var opts = [];
            for (name in user.addresses) {
                if (user.addresses.hasOwnProperty(name)) {
                    opts.push({
                        model: 'Location',
                        path: 'addresses.' + name + '.location'
                    });
                }
            }
            Users.populate(user, opts, function (err, user) {
                if (err) {
                    log.error('users:populate', err);
                    return res.pond(errors.serverError());
                }
                res.send(user);
            });
        });
    });

    /**
     * /users/51bfd3bd5a51f1722d000001
     */
    router.put('/:id', validators.update, sanitizers.create, function (req, res) {
        Users.findOneAndUpdate(req.query, req.body, {new: true}, function (err, user) {
            if (err) {
                log.error('users:find-one-and-update', err);
                return res.pond(errors.serverError());
            }
            if (!user) {
                return res.pond(errors.notFound())
            }
            //TODO: handle 404 case
            res.send(user);
        });
    });

    /**
     * /users?data={}
     */
    router.get('/', validators.find, function (req, res) {
        mongutils.find(Users, req.query.data, function (err, users, paging) {
            if (err) {
                log.error('users:find', err);
                return res.pond(errors.serverError());
            }
            res.many(users, paging);
        });
    });
};
