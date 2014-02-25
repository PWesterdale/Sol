var m = require('mongoose'),
	schema = m.Schema,
	config = require('./config/sol.json');

var mUrl = config.db.url;

var connection = m.connect(mUrl);

module.exports = {
	schema : {}
};

module.exports.db = m;
module.exports.schema.messages = require('./models/messages')(schema, m);
module.exports.schema.users = require('./models/users')(schema, m);
module.exports.schema.projects = require('./models/projects')(schema, m);
module.exports.schema.issues = require('./models/issues')(schema, m);
module.exports.schema.config = require('./models/config')(schema, m);

var commit = require('./models/fields/commit.js')(m);
module.exports.schema.commit = m.model('Commit', commit[0]);
module.exports.dbUrl = mUrl;