var async = require('async');

// Constructor
module.exports.CoreRouter = function(){

	this.async = async;
	this.toPopulate = [];
	this.populateSelect = [];
	this.entity = false;

	this.findAll = function(req, res){

		if(!this.schema){
			res.status(500);
			res.send('No schema set against core object.');
		}

		this.schema.find()
			.populate(this.toPopulate.join(' '), this.populateSelect.join(' '))
			.exec(function(err, entities){
				if(err) {
					res.status(500);
					res.send("An error occured locating " + this.entity + "'s");
				} else {
					res.send(entities);
				}
		});

	};

	this.basicValidate = function(req, res, fields){
		if(!req.body){
			var rtn = {'status' : 'error', 'missing' : fields};
			res.send(rtn);
		} else {
			var missing = [];
			for(i in fields){
				if(!req.body[fields[i]]){
					missing.push(fields[i]);
				}
			}
			if(missing.length > 0){
				var rtn = {'status' : 'error', 'missing' : missing};
				res.send(rtn);
			} else {
				return true;
			}
		}
	};

	this.findById = function(id){

	}
}