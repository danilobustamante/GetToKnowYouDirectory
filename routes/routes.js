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
	var queryString = 'SELECT accessLevel, members_firstname FROM users, members WHERE username=? AND password=? AND '+
						'members_MemberID = MemberID';
	var prefix = ")]}',\n";
	var json = '';
	global.connection.query(queryString, [req.headers.username, req.headers.password], function(err, rows, fields){
		//TODO return unique identifier for login session
		if (err || rows[0]==undefined){
			json = {authenticated:'false'};
		}
		else{
			if(rows[0].accessLevel!=undefined){
				json = {authenticated:'true', accessLevel:rows[0].accessLevel, username:req.headers.username, name:rows[0].members_firstname};
			}
		}
		res.contentType('application/json');
		res.send(prefix+JSON.stringify(json));
	});
});
//deprecated
/*
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
});*/

router.get('/logout', function(req, res){
	var prefix = ")]}',\n";
	res.contentType('application/json');
	var json = {authenticated:'false'};
	res.send(prefix+JSON.stringify(json));
});

router.get('/wards', function(req, res){
	//TODO authenticate
	var queryString = 'SELECT WardID, wards_name, stakes_name FROM wards, stakes, wards_has_users, users WHERE username=? AND '
						+'WardID=wards_WardID AND UserID=users_UserID AND StakeID=stakes_StakeID';
	var wardsArray = [];
	var prefix = ")]}',\n";
	global.connection.query(queryString, [req.headers.username], function(err, rows, fields){
		if (err || !rows){
			res.redirect('/500Error');
		}
		else{
			for(var i in rows){
				var object = {id:rows[i].WardID, 'ward':rows[i].wards_name, 'stake':rows[i].stakes_name};
				wardsArray[i] = object;
			}
			res.send(prefix+JSON.stringify(wardsArray));
		}
	});
});

router.get('/directoryPreview', function(req, res){
	//TODO authenticate
	var queryString = 'SELECT members_firstname, members_lastname, imageLocation FROM members, wards WHERE ' +
						'wards_name=? AND wards_WardID = WardID';
	var prefix = ")]}',\n";
	var membersArray = [];
	global.connection.query(queryString, [req.headers.ward], function(err, rows, fields){
		if (err || !rows){
			res.redirect('/500Error');
		}
		else{
			for(var i in rows){
				var object = {'firstname':rows[i].members_firstname, 'lastname':rows[i].members_lastname, 'img':rows[i].imageLocation};
				membersArray[i] = object;
				if(i==2){
					break;
				}
			}
			res.send(prefix+JSON.stringify(membersArray));
		}
	});
});

router.get('/directory', function(req, res){
	//TODO authenticate
	var queryString = 'SELECT members_firstname, members_lastname, imageLocation FROM members, wards WHERE ' +
						'wards_name=? AND wards_WardID = WardID';
	var prefix = ")]}',\n";
	var membersArray = [];
	global.connection.query(queryString, [req.headers.ward], function(err, rows, fields){
		if (err || !rows){
			res.redirect('/500Error');
		}
		else{
			for(var i in rows){
				var object = {'firstname':rows[i].members_firstname, 'lastname':rows[i].members_lastname, 'img':rows[i].imageLocation};
				membersArray[i] = object;
			}
			res.send(prefix+JSON.stringify(membersArray));
		}
	});
});

module.exports = router;