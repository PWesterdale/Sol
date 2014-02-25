module.exports = function(schema, mongoose){

	var issueSchema = schema({
	    id: Number,
		issue: String,
		description: String,
		status: String,
		priority: String,
		url: String,
		group: String,
		assignee: {type: schema.Types.ObjectId, ref: 'User'},
	    commits: require('./fields/commit.js')(mongoose),
	    participants: [{ type: schema.Types.ObjectId, ref: 'User'}],
	    creator: { type: schema.Types.ObjectId, ref: 'User'},
	    posted : { type: Date, default: Date.now }
	});

	var issueModel = mongoose.model('Issue', issueSchema);

	return issueModel;
}