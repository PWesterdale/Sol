module.exports = function(mongoose){

	var commit = mongoose.Schema({
		creator : {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
		message : String,
		actions : mongoose.Schema.Types.Mixed,
		entityId : mongoose.Schema.Types.ObjectId,
		posted : { type: Date, default: Date.now }
	});

	return [commit];

}