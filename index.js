var log = require('logger')('user-service');
var utils = require('utils');
var User = require('user');
var mongoose = require('mongoose');
var Token = require('token');
var mongutils = require('mongutils');
var sanitizer = require('./sanitizer');

var express = require('express');
var app = module.exports = express();

var paging = {
    start: 0,
    count: 10,
    sort: ''
};

var fields = {
    '*': true
};

/**
 * { "email": "ruchira@serandives.com", "password": "mypassword" }
 */
app.post('/users', function (req, res) {
    User.create(req.body, function (err, user) {
        if (err) {
            log.error(err);
            res.status(500).send([{
                code: 500,
                message: 'Internal Server Error'
            }]);
            return;
        }
        res.status(204).end();
    });
});

/**
 * /users/51bfd3bd5a51f1722d000001
 */
app.get('/users/:id', function (req, res) {
    var id = req.params.id;
    if (!mongutils.objectId(id)) {
        res.status(404).send([{
            code: 404,
            message: 'User Not Found'
        }]);
        return;
    }
    if (id != req.token.user.id) {
        res.status(401).send([{
            code: 401,
            message: 'Unauthorized'
        }]);
        return;
    }
    User.findOne({
        _id: id
    }).exec(function (err, user) {
        if (err) {
            log.error(err);
            res.status(500).send([{
                code: 500,
                message: 'Internal Server Error'
            }]);
            return;
        }
        if (!user) {
            res.status(404).send([{
                code: 404,
                message: 'User Not Found'
            }]);
            return;
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
        User.populate(user, opts, function (err, user) {
            if (err) {
                log.error(err);
                res.status(500).send([{
                    code: 500,
                    message: 'Internal Server Error'
                }]);
                return;
            }
            res.send(user);
        });
    });
});

/**
 * /users/51bfd3bd5a51f1722d000001
 */
app.post('/users/:id', function (req, res) {
    if (!mongutils.objectId(req.params.id)) {
        res.status(404).send([{
            code: 404,
            message: 'User Not Found'
        }]);
        return;
    }
    User.update({
        _id: req.params.id
    }, req.body, function (err, user) {
        if (err) {
            log.error(err);
            res.status(500).send([{
                code: 500,
                message: 'Internal Server Error'
            }]);
            return;
        }
        //TODO: handle 404 case
        res.status(204).end();
    });
});

/**
 * /users?data={}
 */
app.get('/users', function (req, res) {
    var data = req.query.data ? JSON.parse(req.query.data) : {};
    sanitizer.clean(data.query || (data.query = {}));
    utils.merge(data.paging || (data.paging = {}), paging);
    utils.merge(data.fields || (data.fields = {}), fields);
    User.find(data.query)
        .skip(data.paging.start)
        .limit(data.paging.count)
        .sort(data.paging.sort)
        .exec(function (err, users) {
            if (err) {
                log.error(err);
                res.status(500).send([{
                    code: 500,
                    message: 'Internal Server Error'
                }]);
                return;
            }
            res.send(users);
        });
});
