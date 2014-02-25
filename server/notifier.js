var faye = require('faye');
var bayeux = new faye.NodeAdapter({mount: '/jeeves', timeout: 45});
var client = bayeux.getClient();
var newhttp = require('http');

var subscriptions = [
  '/jeeves/**',
  '/**'
];

var parseCookies = function(request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = unescape(parts.join('='));
    });

    return list;
}

module.exports = function(data)
{

	var authorized = function(req, message, cb) {
		console.log('called');
		var cookies = parseCookies(req);
		var postData = cookies['connect.sess'].match(/{(.*?)}/gi);

		var authKey = JSON.parse(postData[0]).auth_key;
		var entity = message.split('/')[1];
		var param = message.split('/')[2];

		data.schema.users.findOne({auth_key: authKey})
		.exec(function(err, user){
			if(err){
				console.log('cannot find user.');
				cb(false);
			} else {
				switch(entity){
					case 'user':
						if(param == user.auth_key){
							cb(true);
						} else {
							cb(false);
						}
					break;
					case 'project':
						data.schema.projects.findOne({_id: param})
							.where('participants').in([user._id])
							.exec(function(err, proj){
								if(err){
									cb(false);
								} else {
									cb(true);
								}
							});
					break;
					default:
					//return false;
				}
			}
		});
	};

	var serverAuth = {
	  incoming: function(message, req, callback) {
	    if (message.channel === '/meta/subscribe') {
	      authorized(req, message.subscription, function(auth){
	      	if(!auth){
	      		message.error = '403::Authentication required';
	      	}

	      });
	    }
	    callback(message);
	  }
	};

	var server = newhttp.createServer();
	bayeux.addExtension(serverAuth);
	bayeux.attach(server);
	server.listen(9401);

	return client;

}