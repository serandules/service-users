var nconf = require('nconf');

nconf.overrides({
    "SERVICE_CONFIGS": "master:www:/apis/v/configs",
    "SERVICE_TOKENS": "master:accounts:/apis/v/tokens",
    "SERVICE_OTPS": "master:accounts:/apis/v/otps",
    "LOCAL_USERS": __dirname + "/..:accounts:/apis/v/users"
});

require('pot');
