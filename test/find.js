var log = require('logger')('service-users:test:find');
var should = require('should');
var request = require('request');
var pot = require('pot');
var mongoose = require('mongoose');
var errors = require('errors');

describe('GET /users', function () {
  var user;
  var accessToken;
  var client;
  before(function (done) {
    pot.client(function (err, c) {
      if (err) {
        return done(err);
      }
      client = c;
      request({
        uri: pot.resolve('accounts', '/apis/v/users'),
        method: 'POST',
        headers: {
          'X-Captcha': 'dummy'
        },
        json: {
          email: 'find-user@serandives.com',
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
        b.email.should.equal('find-user@serandives.com');
        user = b;
        request({
          uri: pot.resolve('accounts', '/apis/v/tokens'),
          method: 'POST',
          headers: {
            'X-Captcha': 'dummy'
          },
          form: {
            client_id: client.serandivesId,
            grant_type: 'password',
            username: 'find-user@serandives.com',
            password: '1@2.Com',
            redirect_uri: pot.resolve('accounts', '/auth')
          },
          json: true
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

  it('anonymous unauthorized', function (done) {
    request({
      uri: pot.resolve('accounts', '/apis/v/users'),
      method: 'GET',
      json: true
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(200);
      should.exist(b);
      should.exist(b.length);
      b.length.should.equal(0);
      done();
    });
  });

  it('logged in unauthorized', function (done) {
    request({
      uri: pot.resolve('accounts', '/apis/v/users'),
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
      should.exist(b.length);
      b.length.should.equal(1);
      should.exist(b[0].id);
      b[0].id.should.equal(user.id);
      done();
    });
  });

  it('by admin', function (done) {
    pot.admin(function (err, admin) {
      if (err) {
        return done(err);
      }
      request({
        uri: pot.resolve('accounts', '/apis/v/users'),
        method: 'GET',
        auth: {
          bearer: admin.token
        },
        json: true
      }, function (e, r, b) {
        if (e) {
          return done(e);
        }
        r.statusCode.should.equal(200);
        should.exist(b);
        should.exist(b.length);
        b.length.should.be.above(1);
        done();
      });
    });
  });
});