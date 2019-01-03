var log = require('logger')('service-users:test:update');
var should = require('should');
var request = require('request');
var _ = require('lodash');
var pot = require('pot');
var errors = require('errors');

var Groups = require('model-groups');

describe('PUT /users', function () {
  var client;
  var user;
  var accessToken;
  var groups;

  var createOTPS = function (token, done) {
    request({
      uri: pot.resolve('accounts', '/apis/v/otps'),
      method: 'POST',
      json: {
        name: 'accounts-update',
        password: pot.password()
      },
      auth: {
        bearer: token
      }
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(201);
      should.exist(b);
      should.exist(b.id);
      should.exist(b.value);
      should.exist(r.headers['location']);
      r.headers['location'].should.equal(pot.resolve('accounts', '/apis/v/otps/' + b.id));
      done(null, b);
    })
  };

  before(function (done) {
    pot.client(function (err, c) {
      if (err) {
        return done(err);
      }
      client = c;
      pot.groups(function (err, groupz) {
        if (err) {
          return done(err);
        }
        groups = groupz;
        request({
          uri: pot.resolve('accounts', '/apis/v/users'),
          method: 'POST',
          headers: {
            'X-Captcha': 'dummy'
          },
          json: {
            email: 'update-user@serandives.com',
            password: pot.password(),
            alias: 'update-user'
          }
        }, function (e, r, b) {
          if (e) {
            return done(e);
          }
          r.statusCode.should.equal(201);
          should.exist(b);
          should.exist(b.id);
          should.exist(b.email);
          b.email.should.equal('update-user@serandives.com');
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
              username: 'update-user@serandives.com',
              password: pot.password(),
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
  });

  it('groups arrays permission', function (done) {
    request({
      uri: pot.resolve('accounts', '/apis/v/users/' + user.id),
      method: 'GET',
      auth: {
        bearer: accessToken
      },
      json: true
    }, function (e, r, usr) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(200);
      should.exist(usr);
      should.exist(usr.id);
      should.exist(usr.email);
      usr.id.should.equal(user.id);
      usr.email.should.equal('update-user@serandives.com');
      Groups.find({}, function (err, groups) {
        if (err) {
          return done(err);
        }
        usr.groups = _.map(groups, '_id');
        createOTPS(accessToken, function (err, otp) {
          if (err) {
            return done(err);
          }
          request({
            uri: pot.resolve('accounts', '/apis/v/users/' + user.id),
            method: 'PUT',
            headers: {
              'X-OTP': otp.value
            },
            auth: {
              bearer: accessToken
            },
            json: usr
          }, function (e, r, b) {
            if (e) {
              return done(e);
            }
            r.statusCode.should.equal(errors.unprocessableEntity().status);
            should.exist(b);
            should.exist(b.code);
            should.exist(b.message);
            b.code.should.equal(errors.unprocessableEntity().data.code);
            var pub = _.find(groups, function (group) {
              return group.name === 'public';
            });
            usr.groups = [String(pub._id)];
            createOTPS(accessToken, function (err, otp) {
              if (err) {
                return done(err);
              }
              request({
                uri: pot.resolve('accounts', '/apis/v/users/' + user.id),
                method: 'PUT',
                headers: {
                  'X-OTP': otp.value
                },
                auth: {
                  bearer: accessToken
                },
                json: usr
              }, function (e, r, b) {
                if (e) {
                  return done(e);
                }
                r.statusCode.should.equal(200);
                should.exist(b);
                should.exist(b.id);
                should.exist(b.email);
                b.id.should.equal(user.id);
                done();
              });
            });
          });
        });
      });
    });
  });

  it('password update without otp', function (done) {
    request({
      uri: pot.resolve('accounts', '/apis/v/users/' + user.id),
      method: 'GET',
      auth: {
        bearer: accessToken
      },
      json: true
    }, function (e, r, usr) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(200);
      should.exist(usr);
      should.exist(usr.id);
      should.exist(usr.email);
      usr.id.should.equal(user.id);
      usr.email.should.equal('update-user@serandives.com');
      usr.password = pot.password();
      request({
        uri: pot.resolve('accounts', '/apis/v/users/' + user.id),
        method: 'PUT',
        auth: {
          bearer: accessToken
        },
        json: usr
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
  });

  it('password update with otp', function (done) {
    request({
      uri: pot.resolve('accounts', '/apis/v/users/' + user.id),
      method: 'GET',
      auth: {
        bearer: accessToken
      },
      json: true
    }, function (e, r, usr) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(200);
      should.exist(usr);
      should.exist(usr.id);
      should.exist(usr.email);
      usr.id.should.equal(user.id);
      usr.email.should.equal('update-user@serandives.com');
      request({
        uri: pot.resolve('accounts', '/apis/v/otps'),
        method: 'POST',
        auth: {
          bearer: accessToken
        },
        json: {
          name: 'accounts-update',
          password: pot.password()
        }
      }, function (e, r, b) {
        if (e) {
          return done(e);
        }
        r.statusCode.should.equal(201);
        should.exist(b);
        should.exist(b.id);
        should.exist(b.name);
        should.exist(b.value);
        usr.password = pot.password();
        request({
          uri: pot.resolve('accounts', '/apis/v/users/' + user.id),
          method: 'PUT',
          headers: {
            'X-OTP': b.value
          },
          auth: {
            bearer: accessToken
          },
          json: usr
        }, function (e, r, b) {
          if (e) {
            return done(e);
          }
          r.statusCode.should.equal(200);
          should.exist(b);
          should.exist(b.id);
          should.exist(b.email);
          b.id.should.equal(usr.id);
          request({
            uri: pot.resolve('accounts', '/apis/v/tokens'),
            method: 'POST',
            headers: {
              'X-Captcha': 'dummy'
            },
            form: {
              client_id: client.serandivesId,
              grant_type: 'password',
              username: 'update-user@serandives.com',
              password: pot.password(),
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
  });

  it('password update with invalid otp', function (done) {
    request({
      uri: pot.resolve('accounts', '/apis/v/users/' + user.id),
      method: 'GET',
      auth: {
        bearer: accessToken
      },
      json: true
    }, function (e, r, usr) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(200);
      should.exist(usr);
      should.exist(usr.id);
      should.exist(usr.email);
      usr.id.should.equal(user.id);
      usr.email.should.equal('update-user@serandives.com');
      request({
        uri: pot.resolve('accounts', '/apis/v/otps'),
        method: 'POST',
        auth: {
          bearer: accessToken
        },
        json: {
          name: 'invalid-otp',
          password: pot.password()
        }
      }, function (e, r, b) {
        if (e) {
          return done(e);
        }
        r.statusCode.should.equal(201);
        should.exist(b);
        should.exist(b.id);
        should.exist(b.name);
        should.exist(b.value);
        usr.password = pot.password();
        request({
          uri: pot.resolve('accounts', '/apis/v/users/' + user.id),
          method: 'PUT',
          headers: {
            'X-OTP': b.value
          },
          auth: {
            bearer: accessToken
          },
          json: usr
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
    });
  });
});