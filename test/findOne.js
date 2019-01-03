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
          email: 'findone-user@serandives.com',
          password: '1@2.Com',
          alias: 'findone-user'
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
          headers: {
            'X-Captcha': 'dummy'
          },
          form: {
            client_id: client.serandivesId,
            grant_type: 'password',
            username: 'findone-user@serandives.com',
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

  it('unauthorized', function (done) {
    request({
      uri: pot.resolve('accounts', '/apis/v/users/' + user.id),
      method: 'GET',
      json: true
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(200);
      should.exist(b.id);
      should.exist(b.alias);
      Object.keys(b).length.should.equal(2);
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
      request({
        uri: pot.resolve('accounts', '/apis/v/users/' + user.id),
        method: 'GET',
        json: true
      }, function (e, r, b) {
        if (e) {
          return done(e);
        }
        r.statusCode.should.equal(200);
        should.exist(b);
        should.exist(b.id);
        should.exist(b.alias);
        Object.keys(b).length.should.equal(2);
        request({
          uri: pot.resolve('accounts', '/apis/v/users/' + user.id),
          method: 'GET',
          qs: {
            data: JSON.stringify({
              fields: {
                alias: 1
              }
            })
          },
          json: true
        }, function (e, r, b) {
          if (e) {
            return done(e);
          }
          r.statusCode.should.equal(200);
          should.exist(b);
          should.exist(b.id);
          should.exist(b.alias);
          b.id.should.equal(user.id);
          done();
        });
      });
    });
  });
});