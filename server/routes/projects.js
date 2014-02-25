var r_proj = new (require('./core.js')).CoreRouter();

r_proj.entity = 'projects';

r_proj.toPopulate = ['creator', 'participants', 'issues'];
r_proj.populateSelect = ['-password', '-auth_key'];

module.exports = function(data, app)
{
	r_proj.schema = data.schema.projects;
	var CoreProject = data.schema.projects;

	app.get('/api/v1/projects', function(req, res){

		CoreProject.find()
			.populate(r_proj.toPopulate.join(' '), r_proj.populateSelect.join(' '))
			.exec(function(err, entities){
				if(err) {
					res.status(500);
					res.send("An error occured locating " + r_org.entity + "'s");
				} else {
					res.send(entities);
				}
		});

	});

	app.all('/api/v1/project/:project/*', function(req, res, next){

		CoreProject.findOne({url: req.params.project})
			//.where('participants').in([req.user._id]) // Only get organisations for this user.
			.exec(function(err, proj){
				if(err || !proj){
					res.status(401);
					res.send('Project could not be located');
				} else {
					req.proj = proj;
					next();
				}
		});

	});

	app.get('/api/v1/project/:project', function(req, res, next){

		CoreProject.findOne({url: req.params.project})
			.populate(r_proj.toPopulate.join(' '), r_proj.populateSelect.join(' '))
			.populate('participants', r_proj.populateSelect.join(' '))
			.exec(function(err, proj){
				if(err || !proj){
					res.status(401);
					res.send('Project could not be located');
				} else {
					res.status(200);
					res.send(proj);
				}
		});

	});

	app.put('/api/v1/project', function(req, res){

		if(r_proj.basicValidate(req, res, ['name', 'url'])){

			var project = new CoreProject({
				name: req.body.name,
				desc: req.body.desc,
				url: req.body.url,
				participants : [req.user._id],
				creator: req.user._id
			});

			project.save(function(err, dbproject) {
				res.send(dbproject);
			});

		}

	});

}