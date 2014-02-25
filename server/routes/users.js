var r_users = new (require('./core.js')).CoreRouter();
var uuid = require('node-uuid');
r_users.entity = 'users';

module.exports = function(data, app)
{
	var CoreUser = data.schema.users;

	app.post('/login', function(req, res){
		CoreUser.findOne({email: req.body.email})
			.exec(function(err, dbuser){
				if(err){
					res.status(500);
					res.send('We cannot find your account.');
				} else {
					dbuser.comparePassword(req.body.password, (function(err, match){
						if(err || !match){
							res.status(500);
							res.send('Something went wrong.');
						} else if(match) {
							var authKey = uuid.v4();
							dbuser.auth_key = authKey;
							dbuser.save(function(err, dbauthuser){
								res.status(200);
								req.session.auth_key = authKey;
								res.send({status : 'success'});
							});
						}
					}));
				}
			})
	});

	app.post('/collect', function(req, res){

		if(r_users.basicValidate(req, res, ['name', 'password'])){

			CoreUser.findOne({auth_key: req.body.key})
				.exec(function(err, dbuser){
					if(err){
						res.status(500);
						res.send('We cannot find your account.');
					} else {

						var authKey = uuid.v4();
						dbuser.name = req.body.name,
						dbuser.password = req.body.password,
						dbuser.auth_key = authKey;
						dbuser.status = "complete";
						dbuser.save(function(err, dbauthuser){
							res.status(200);
							req.session.auth_key = authKey;
							res.send({status : 'success'});
						});
					}
				});
		}

	});

	app.all('/api/*', function(req, res, next){
		if(!req.query.auth_key || req.query.auth_key == 0){
			res.status(401);
			res.send('You are not authenticated with the server');
		} else {
			CoreUser.findOne({auth_key: req.query.auth_key})
				//.populate('messages')
				.exec(function(err, m_user){
					if(err){
						res.status(401);
						res.send('Your token is incorrect');
					} else {
						req.user = m_user;
						next();
					}
			});
		}
	});

	app.put('/register', function(req, res){

		if(r_users.basicValidate(req, res, ['email', 'name', 'password'])){

			var authKey = uuid.v4();

			var user = new CoreUser({
				email: req.body.email,
				name: req.body.name,
				password: req.body.password,
				status: 'unconfirmed',
				auth_key: authKey
			});

			user.save(function(err, dbuser) {
				if(err){
					res.send(500);
					res.send({'status' : 'error', 'message' : err});
				} else {
					res.status(200);
					req.session.auth_key = authKey;
					res.send({'status' : 'success'});
				}
			});

		}

	});

	app.get('/api/v1/users', function(req, res){

		CoreUser.find()
			.select('-password -auth_key')
			.exec(function(err, users){
				if(err) {
					res.status(500);
					res.send('An error occured locating users');
				} else {
					res.send(users);
				}
			});

	});

	app.get('/api/v1/user', function(req, res){
		CoreUser.findOne({auth_key: req.query.auth_key})
			.select('-password -auth_key')
			.populate('messages')
			.exec(function(err, m_user){
				if(err){
					res.status(401);
					res.send('Your token is incorrect');
				} else {
					res.status(200);
					res.send(m_user);
				}
		});
	});

	app.get('/user/pre-collect', function(req, res, next){
		CoreUser.findOne({auth_key: req.query.token, status : 'awaitingClaim'})
			.select('-password -auth_key')
			.exec(function(err, m_user){
				if(err || !m_user){
					res.status(500);
					res.send('Cannot find user');
				} else {
					res.status(200);
					res.send(m_user);
				}
		});
	});

	app.put('/user/collect', function(req, res, next){
		CoreUser.findOne({auth_key: req.query.token, status : 'awaitingClaim'})
			.select('-password -auth_key')
			.exec(function(err, m_user){
				if(err || !m_user){
					res.status(500);
					res.send('Cannot find user');
				} else {

					m_user.name = req.body.name;
					m_user.password = req.body.password;
					m_user.auth_key = uuid.v4();
					m_user.status = 'Confirmed';

					m_user.save(function(err, dbuser) {
						if(err){
							res.send(500);
							res.send({'status' : 'error', 'message' : err});
						} else {
							res.status(200);
							req.session.auth_key = dbuser.auth_key;
							res.send({'status' : 'success'});
						}
					});

				}
		});
	});

	app.put('/api/v1/user/invite', function(req, res, next){

		data.schema.users.findOne({email : req.body.invitee})
		.exec(function(err, user){
			if(!err) {

				if(!user){
					var authKey = uuid.v4();

					var user = new data.schema.users({
						email: req.body.invitee,
						password: uuid.v1(),
						status: 'awaitingClaim',
						auth_key: authKey
					});

					user.save(function(err, dbuser) {
						if(err){
							res.status(500);
							res.send({'status' : 'error', 'message' : err});
						} else {
							data.mailer.invite(dbuser, function(err){
								if(err){
									console.log(err);
								} else {
									res.status(200);
									res.send({'status' : 'success'});
								}

							});
						}
					});

				} else {
					res.status(500);
					res.send({'status' : 'error', 'message' : 'This user is already registered'});
				}
			}
		})
	});

}