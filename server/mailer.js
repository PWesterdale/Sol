module.exports = function(app)
{
	var mailer = {
		invite : function(user, cb) {

			app.mailer.send('mailers/collect', {
					to: user.email,
					subject: 'You have been invited to join Sol', // REQUIRED.
					collectUrl: 'http://localhost:9494/#/collect/' + user.auth_key
				}, function (err) {
				if (err) {
					// handle error
					cb(err);
				}
				cb(null);
			});
		},
	}

	return mailer;
}