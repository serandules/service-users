var nconf = require('nconf');

nconf.overrides({
    "SERVICE_CONFIGS": "master:accounts:/apis/v/configs",
    "SERVICE_TOKENS": "master:accounts:/apis/v/tokens",
    "LOCAL_USERS": __dirname + "/..:accounts:/apis/v/users"
});