var r_issue = new (require('./core.js')).CoreRouter();

r_issue.entity = 'issues';

r_issue.toPopulate = ['creator', 'participants', 'assignee'];
r_issue.populateSelect = ['-password', '-auth_key', '-messages', '-status'];

module.exports = function(data, app)
{
	r_issue.schema = data.schema.issues;
	var CoreIssue = data.schema.issues;
	var CoreCommit = data.schema.commit;

	var notifier = {
		projectAddIssue : function(issue, proj){

			var opts = [
				{path: 'creator', select: r_issue.populateSelect[0]},
				{path: 'participants', select: r_issue.populateSelect[0]},
				{path: 'assignee', select: r_issue.populateSelect[0]},
			];
			CoreIssue.populate(issue, opts, function (err, pIssue) {
				var cleanIssue = pIssue.toJSON();
				cleanIssue.posted = pIssue.posted.toISOString();

				var payload = {
					'type' : 'newIssue',
					'updateWith' : cleanIssue
				};

				data.j.publish('/project/' + proj.url, payload);

			});

		},
		projectUpdateIssue : function(issue, proj){
			var cleanIssue = pIssue.toJSON();
			cleanIssue.posted = pIssue.posted.toISOString();

			var payload = {
				'type' : 'updateIssue',
				'updateWith' : cleanIssue
			};

			data.j.publish('/project/' + proj.url, payload);
		}
	};

	app.get('/api/v1/project/:proj/issue/:issue', function(req, res){

		CoreIssue.findOne()
			.populate(r_issue.toPopulate.join(' '), r_issue.populateSelect.join(' '))
			.where('_id').in(req.proj.issues)
			.where('id', req.params.issue)
			.exec(function(err, entity){
				if(err) {
					res.status(500);
					res.send("An error occured locating " + r_org.entity + "'s");
				} else {
					res.send(entity);
				}
		});

	});

	app.get('/api/v1/project/:proj/issues', function(req, res){

		CoreIssue.find()
			.populate(r_issue.toPopulate.join(' '), r_issue.populateSelect.join(' '))
			.where('_id').in(req.proj.issues)
			.exec(function(err, entities){
				if(err) {
					res.status(500);
					res.send("An error occured locating " + r_org.entity + "'s");
				} else {
					res.send(entities);
				}
		});

	});

	app.put('/api/v1/project/:proj/issue/:issue', function(req, res){
		if(r_issue.basicValidate(req, res, [
			'commit',
			'issue'
			])){

		CoreIssue.findOne()
			.where('_id').in(req.proj.issues)
			.where('id', req.body.issue.id)
			.exec(function(err, entity){
				if(err) {
					res.status(500);
					res.send("An error occured locating " + r_org.entity + "'s");
				} else {

					var fields = ['priority', 'status', 'group', 'assignee'];

					for(var i in fields){
						if(req.body.issue[fields[i]]){
							entity[fields[i]] = req.body.issue[fields[i]];
 						}
					}
					var commit = new CoreCommit({
						creator: req.user._id,
						message: req.body.commit.message,
						actions: req.body.commit.actions,
					});

					entity.commits.push(commit);

					var isParticipant = false;
					var inviteIsParticipant = false;

					for(var x in entity.participants){
						if(entity.participants[x] == req.user._id.toString()){
							isParticipant = true;
						}
						if(entity.participants[x] == req.assignee){
							inviteIsParticipant = true;
						}
					}

					if(!isParticipant){
						entity.participants.push(req.user._id);
					}

					if(!inviteIsParticipant && req.user._id.toString() != req.assignee){
						entity.participants.push(req.assignee);
						// Send message!
					}

					entity.save(function(err, issue){
						if(err){
							console.log(err);
						} else {
							var opts = [
								{path: 'creator', select: r_issue.populateSelect[0]},
								{path: 'participants', select: r_issue.populateSelect[0]},
								{path: 'assignee', select: r_issue.populateSelect[0]},
							];
							CoreIssue.populate(issue, opts, function (err, pIssue) {
								res.send(pIssue);
								notifier.projectUpdateIssue(pIssue, rq.proj);
								notifier.issueUpdate(pIssue);
							});
						}
					});
				}
		});

		}
	});

	app.put('/api/v1/project/:proj/issue', function(req, res){

		if(r_issue.basicValidate(req, res, [
			'issue',
			'description',
			'status',
			'priority',
			'assignee',
			])){

			var issue = new CoreIssue({
				issue: req.body.issue,
				description: req.body.description,
				status: req.body.status,
				priority: req.body.priority,
				assignee: data.db.Types.ObjectId(req.body.assignee),
				group : req.body.group,
				participants: [req.user._id],
				creator: req.user._id
			});

			issue.id = (req.proj.issues.length) + 1;

			if(req.user._id.toString() != req.body.assignee){
				issue.participants.push(data.db.Types.ObjectId(req.body.assignee));
			}

			issue.save(function(err, dbissue) {
				req.proj.issues.push(dbissue._id);
				req.proj.save(function(err, o) {
					res.send(dbissue);
					notifier.projectAddIssue(dbissue, o);
				});
			});

		}

	});

}