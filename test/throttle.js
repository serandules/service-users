var pot = require('pot');

pot.throttlit('accounts', 'users');

var domain = 'accounts';
var model = 'users';

pot.throttlit('accounts', 'users', {
  apis: {
    confirm: {
      second: 0,
      day: 1,
      month: 2
    },
    recover: {
      second: 0,
      day: 1,
      month: 2
    },
    reset: {
      second: 0,
      day: 1,
      month: 2
    }
  },
  ips: {
    confirm: {
      second: 0,
      minute: 1,
      hour: 2,
      day: 3
    },
    recover: {
      second: 0,
      minute: 1,
      hour: 2,
      day: 3
    },
    reset: {
      second: 0,
      minute: 1,
      hour: 2,
      day: 3
    }
  }
}, {
  confirm: {
    POST: function (i) {
      return {
        url: pot.resolve(domain, '/apis/v/' + model + '/dummy'),
        headers: {
          'X-Action': 'confirm'
        }
      }
    }
  },
  recover: {
    POST: function (i) {
      return {
        url: pot.resolve(domain, '/apis/v/' + model + '/dummy'),
        headers: {
          'X-Action': 'recover'
        }
      }
    }
  },
  reset: {
    POST: function (i) {
      return {
        url: pot.resolve(domain, '/apis/v/' + model + '/dummy'),
        headers: {
          'X-Action': 'reset'
        }
      }
    }
  }
});
