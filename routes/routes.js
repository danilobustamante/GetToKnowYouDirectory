var express = require('express');
var router = express.Router();




router.get('/', function(req, res){
	//res.send('Hello from the Router');
	res.render('index', {
    env: 'dev',
    title: 'YSA Ward Directory'
  });
});

router.get('/login', function(req, res){
	var data = {username:req.headers.username, password:req.headers.password};
	var queryString = 'SELECT accessLevel FROM users WHERE username=? AND password=?';
	var prefix = ")]}',\n";
	global.connection.query(queryString, [req.headers.username, req.headers.password], function(err, rows, fields){
		//TODO return unique identifier for login session
		if (err || rows[0]==undefined){
			res.redirect('/loginFailure');
		}
		else{
			if(rows[0].accessLevel!=undefined){
				res.redirect('/loginSuccess');
			}
		}
	});
});

router.get('/loginFailure', function(req, res){
	var prefix = ")]}',\n";
	res.contentType('application/json');
	var json = {authenticated:'false'};
	res.send(prefix+JSON.stringify(json));
});
router.get('/loginSuccess', function(req, res){
	var prefix = ")]}',\n";
	res.contentType('application/json');
	var json = {authenticated:'true'};
	res.send(prefix+JSON.stringify(json));
});

module.exports = router;