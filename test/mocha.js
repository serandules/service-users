var nconf = require('nconf');

nconf.overrides({
    'services': [
        {"name": "config-service", "version": "master", "domain": "accounts", "prefix": "/apis/v/configs"},
        {"name": "token-service", "version": "master", "domain": "accounts", "prefix": "/apis/v/tokens"},
        {"name": "user-service", "version": "master", "domain": "accounts", "prefix": "/apis/v/users"}
    ]
});