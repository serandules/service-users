var log = require('logger')('service-users:test:find');
var should = require('should');
var request = require('request');
var pot = require('pot');
var mongoose = require('mongoose');
var errors = require('errors');

describe('GET /users', function () {
    var serandivesId;
    var user;
    var accessToken;
    before(function (done) {
        pot.drop('users', function (err) {
            if (err) {
                return done(err);
            }
            request({
                uri: pot.resolve('accounts', '/apis/v/configs/boot'),
                method: 'GET',
                json: true
            }, function (e, r, b) {
                if (e) {
                    return done(e);
                }
                r.statusCode.should.equal(200);
                log.info(b);
                should.exist(b);
                should.exist(b.name);
                b.name.should.equal('boot');
                should.exist(b.value);
                should.exist(b.value.clients);
                should.exist(b.value.clients.serandives);
                serandivesId = b.value.clients.serandives;
                request({
                    uri: pot.resolve('accounts', '/apis/v/users'),
                    method: 'POST',
                    json: {
                        email: 'findone-user@serandives.com',
                        password: '1@2.Com'
                    }
                }, function (e, r, b) {
                    if (e) {
                        return done(e);
                    }
                    r.statusCode.should.equal(201);
                    should.exist(b);
                    should.exist(b.id);
                    should.exist(b.email);
                    b.email.should.equal('findone-user@serandives.com');
                    user = b;
                    request({
                        uri: pot.resolve('accounts', '/apis/v/tokens'),
                        method: 'POST',
                        json: {
                            client_id: serandivesId,
                            grant_type: 'password',
                            username: 'findone-user@serandives.com',
                            password: '1@2.Com'
                        }
                    }, function (e, r, b) {
                        if (e) {
                            return done(e);
                        }
                        r.statusCode.should.equal(200);
                        should.exist(b.access_token);
                        should.exist(b.refresh_token);
                        accessToken = b.access_token;
                        done();
                    });
                });
            });
        });
    });

    it('unauthorized', function (done) {
        request({
            uri: pot.resolve('accounts', '/apis/v/users/' + user.id),
            method: 'GET',
            json: true
        }, function (e, r, b) {
            if (e) {
                return done(e);
            }
            r.statusCode.should.equal(errors.unauthorized().status);
            should.exist(b);
            should.exist(b.code);
            should.exist(b.message);
            b.code.should.equal(errors.unauthorized().data.code);
            done();
        });
    });

    it('authorized', function (done) {
        request({
            uri: pot.resolve('accounts', '/apis/v/users/' + user.id),
            method: 'GET',
            auth: {
                bearer: accessToken
            },
            json: true
        }, function (e, r, b) {
            if (e) {
                return done(e);
            }
            r.statusCode.should.equal(200);
            should.exist(b);
            should.exist(b.id);
            should.exist(b.email);
            b.id.should.equal(user.id);
            b.email.should.equal('findone-user@serandives.com');
            done();
        });
    });
});