module.exports = function(schema, mongoose){

	var configSchema = schema({
	    name: String,
	    data: schema.Types.Mixed
	});

	var configModel = mongoose.model('Config', configSchema);

	return configModel;
}