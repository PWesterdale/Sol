module.exports = function(schema, mongoose){

	var projectSchema = schema({
	    name: String,
	    url: String,
	    desc: String,
	    participants: [{ type: schema.Types.ObjectId, ref: 'User'}],
	   	issues: [{type: schema.Types.ObjectId, ref: 'Issue'}],
	    creator: { type: schema.Types.ObjectId, ref: 'User'},
	});

	var projectModel = mongoose.model('Project', projectSchema);

	return projectModel;
}