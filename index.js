var log = require('logger')('user-service');
var express = require('express');
var bodyParser = require('body-parser');

var errors = require('errors');
var utils = require('utils');
var mongutils = require('mongutils');
var auth = require('auth');
var serandi = require('serandi');
var Users = require('model-users');

var validators = require('./validators');
var sanitizers = require('./sanitizers');

var paging = {
    start: 0,
    count: 10,
    sort: ''
};

var fields = {
    '*': true
};

module.exports = function (router) {
    router.use(serandi.pond);
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
    router.use(bodyParser.json());

    /**
     * { "email": "ruchira@serandives.com", "password": "mypassword" }
     */
    router.post('/', validators.create, sanitizers.create, function (req, res) {
        Users.create(req.body, function (err, user) {
            if (err) {
                if (err.code === mongutils.errors.DuplicateKey) {
                    return res.pond(errors.conflict());
                }
                log.error(err);
                return res.pond(errors.serverError());
            }
            res.locate(user.id).status(201).send(user);
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
        if (!req.token || !req.user || req.user.id !== id) {
            return res.pond(errors.unauthorized());
        }
        Users.findOne({
            _id: id
        }).exec(function (err, user) {
            if (err) {
                log.error(err);
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
                    log.error(err);
                    return res.pond(errors.serverError());
                }
                res.send(user);
            });
        });
    });

    /**
     * /users/51bfd3bd5a51f1722d000001
     */
    router.post('/:id', function (req, res) {
        if (!mongutils.objectId(req.params.id)) {
            return res.pond(errors.notFound());
        }
        Users.update({
            _id: req.params.id
        }, req.body, function (err, user) {
            if (err) {
                log.error(err);
                return res.pond(errors.serverError());
            }
            //TODO: handle 404 case
            res.send(user);
        });
    });

    /**
     * /users?data={}
     */
    router.get('/', function (req, res) {
        var data = req.query.data ? JSON.parse(req.query.data) : {};
        sanitizer.clean(data.query || (data.query = {}));
        utils.merge(data.paging || (data.paging = {}), paging);
        utils.merge(data.fields || (data.fields = {}), fields);
        Users.find(data.query)
            .skip(data.paging.start)
            .limit(data.paging.count)
            .sort(data.paging.sort)
            .exec(function (err, users) {
                if (err) {
                    log.error(err);
                    return res.pond(errors.serverError());
                }
                res.send(users);
            });
    });
};
