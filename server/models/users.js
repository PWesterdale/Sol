var bcrypt = require('bcrypt');
SALT_WORK_FACTOR = 10;

module.exports = function(schema, mongoose){

	var userSchema = schema({
		name: String,
		initials : String,
		email: {type: String, required: true, index: {unique: true}},
	    password: { type: String, required: true },
	    messages: [{type: schema.Types.ObjectId, ref: 'Message'}],
		auth_key: String,
		status: String,
		issueOrder : schema.Types.Mixed,
		avatar: {
			medium : String,
			original : String
		}
	});

	userSchema.pre('save', function(next) {
	    var user = this;

	    // only hash the password if it has been modified (or is new)
	    if (!user.isModified('password')) return next();

	    // generate a salt

	    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
	        if (err) return next(err);

	        bcrypt.hash(user.password, salt, function(err, hash) {
	            if (err) return next(err);
	            user.password = hash;
	            next();
	        });

	    });
	});

	userSchema.methods.comparePassword = function(candidatePassword, cb) {
	    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
	        if (err) return cb(err);
	        cb(null, isMatch);
	    });
	};

	var userModel = mongoose.model('User', userSchema);
	return userModel;
}