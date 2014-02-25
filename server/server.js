var http = require('http');
var notifier = require('./notifier');
var express = require('express');
var app = express();
var mongoStore = require('connect-mongo')(express);
var mailer = require('express-mailer');
var config = require('./config/sol.json');
var async = require('async');

mailer.extend(app, {
  from: 'pwpico@gmail.com',
  host: 'smtp.gmail.com', // hostname
  secureConnection: true, // use SSL
  port: 465, // port for secure SMTP
  transportMethod: 'SMTP', // default is SMTP. Accepts anything that nodemailer accepts
  auth: {
    user: 'pwpico@gmail.com',
    pass: 'H4quzaxEPh8f4U39ZAmUFre5'
  }
});

/*
 * Data Object
 * contains Mongoose reference * data.db *
 * and all Schemas. * data.schema.{entity} *
*/
var data = require('./data');

app.use(express.static(__dirname + '/../app'));
app.use(express.cookieParser());

app.use(express.cookieSession({
  cookie :{ path: '/', httpOnly: false, maxAge: 60*60*1000},
  store: new mongoStore({
    url: data.dbUrl
  }),
  secret: '1234567890QWERTY', //Todo: replace this with config
}));

app.use(express.json());
app.use(express.urlencoded());

app.set('views', __dirname + '/../app/');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.get('/app', function(req, res){
	res.render(app.get('views') + 'index.html');
});

app.get('/config.json', function(req, res){
  data.schema.users.find().exec(function(err, users){
    if(err){

    } else {
      var conf = {};
      if(users.length == 0){
        conf.installed = false;
      } else {
        conf.installed = true;
      }
      data.schema.config.find().exec(function(err, config){
        conf.settings = {};
        for(x in config){
          conf.settings[config[x].name] = config[x];
        }
        res.send(conf);
      });
    }
  });
});

app.post('/install', function(req, res){
  data.schema.users.find().exec(function(err, users){
    if(err){

    } else {
      if(users.length > 0){
        res.send(500);
      } else {

        pdata = req.body;
        var coreUser = data.schema.users;

        var uuid = require('node-uuid');
        var authKey = uuid.v4();

        var user = new coreUser({
          email: pdata.user.email,
          name: pdata.user.name,
          password: pdata.user.password,
          status: 'coreInstall',
          auth_key: authKey
        });

        user.save(function(err, dbuser) {
          if(err){
            res.send(500);
            res.send({'status' : 'error', 'message' : err});
          } else {
            var forSave = [];
            forSave.push({name : 'priorities', data : pdata.priorities});
            forSave.push({name : 'statuses', data : pdata.statuses});
            forSave.push({name : 'groups', data : pdata.groups});
            async.each(forSave, function(i, cb){
              var c = new data.schema.config({
                name : i.name,
                data : i.data 
              }).save(function(err, cnf){
                cb();
              });
            }, function(err){
                res.status(200);
                req.session.auth_key = authKey;
                res.send({status : 'success'});
            });

          }
        });
      }
    }
  });
});

data.j = require('./notifier')(data);
data.mailer = require('./mailer')(app);

var users = require('./routes/users')(data, app),
	projects = require('./routes/projects')(data, app),
	issues = require('./routes/issues')(data, app);


app.listen(9494); // Main app sits on 9494