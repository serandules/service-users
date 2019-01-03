var log = require('logger')('user-service');
var bodyParser = require('body-parser');

var errors = require('errors');
var mongutils = require('mongutils');
var auth = require('auth');
var utils = require('utils');
var throttle = require('throttle');
var serandi = require('serandi');
var Users = require('model-users');
var model = require('model');
var validators = require('./validators');

var xactions = {
  post: {
    recover: require('./xactions/recover')
  },
  put: {
    reset: require('./xactions/reset')
  }
};

// TODO: validate email address updates through PUT. i.e. switching to a new email address should re-validate the email for ownership
module.exports = function (router, done) {
  utils.group('public', function (err, pub) {
    if (err) {
      return done(err);
    }
    utils.group('anonymous', function (err, anon) {
      if (err) {
        return done(err);
      }
      router.use(serandi.many);
      router.use(serandi.ctx);
      router.use(auth({
        GET: [
          '^\/$',
          '^\/.*'
        ],
        POST: [
          '^\/$',
          '^\/.*'
        ],
        PUT: [
          '^\/$',
          '^\/.*'
        ]
      }));
      router.use(throttle.apis('users'));
      router.use(bodyParser.json());

      router.post('/',
        serandi.json,
        serandi.xactions(xactions.post),
        serandi.captcha,
        serandi.create(Users),
        function (req, res, next) {
          model.create(req.ctx, function (err, user) {
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
            permissions.push({
              group: pub.id,
              actions: ['read']
            });
            permissions.push({
              group: anon.id,
              actions: ['read']
            });

            var visibility = user.visibility;
            var all = visibility['*'];
            all.users.push(user.id);
            var alias = visibility['alias'] || (visibility['alias'] = {groups: []});
            alias.groups.push(pub.id);
            alias.groups.push(anon.id);

            Users.findOneAndUpdate({_id: user.id}, {
              permissions: permissions,
              visibility: visibility
            }, {new: true}).exec(function (err, user) {
              if (err) {
                log.error('users:find-one-and-update', err);
                return res.pond(errors.serverError());
              }
              res.locate(user.id).status(201).send(user);
            });
          });
        });

      router.get('/:id',
        serandi.findOne(Users),
        function (req, res, next) {
          model.findOne(req.ctx, function (err, user) {
            if (err) {
              return next(err);
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
                return next(err);
              }
              res.send(user);
            });
          });
        });

      router.put('/:id',
        serandi.json,
        serandi.xactions(xactions.put),
        serandi.update(Users),
        validators.update,
        function (req, res, next) {
          model.update(req.ctx, function (err, user) {
            if (err) {
              return next(err);
            }
            res.locate(user.id).status(200).send(user);
          });
        });

      router.get('/',
        serandi.find(Users),
        function (req, res, next) {
          model.find(req.ctx, function (err, users, paging) {
            if (err) {
              return next(err);
            }
            res.many(users, paging);
          });
        });

      done();
    });
  });
};
