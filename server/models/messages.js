module.exports = function(schema, mongoose){

	var messageSchema = schema({
		creator : {type: schema.Types.ObjectId, ref: 'User'},
		to : {type: schema.Types.ObjectId, ref: 'User'},
		message : String,
		url : String,
		read : Boolean,
		posted : { type: Date, default: Date.now }
	});

	var messageModel = mongoose.model('Message', messageSchema);

	return messageModel;
}