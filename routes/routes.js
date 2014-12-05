var express = require('express');
var hat = require('hat');
var crypto = require('crypto');
var router = express.Router();
var time_two_weeks = 60*60*24*14;




router.get('/', function(req, res){
	//res.send('Hello from the Router');
	res.render('index', {
    env: 'dev',
    title: 'YSA Ward Directory'
  });
});

router.get('/login', function(req, res){
	var data = {username:req.headers.username, password:req.headers.password};
	var queryString = 'SELECT password_salt FROM users WHERE username=?'
	var prefix = ")]}',\n";
	var json = '';
	res.contentType('application/json');
	global.connection.query(queryString, [req.headers.username], function(err, rows, fields){
		if(err || !rows || !rows[0]){
			console.log(err);
			json = {authenticated:'false'};
			res.send(prefix+JSON.stringify(json));
		}
		else{
			crypto.pbkdf2(req.headers.password, rows[0].password_salt, 10000, 512, function(err, derivedKey){
				queryString = 'SELECT accessLevel, members_firstname, UserID FROM users, members WHERE username=? AND password=? AND '+
									'members_MemberID = MemberID';
				global.connection.query(queryString, [req.headers.username, derivedKey.toString('base64')], function(err, rows, fields){
					if (err || rows[0]==undefined){
						json = {authenticated:'false'};
						res.send(prefix+JSON.stringify(json));
					}
					else{
						if(rows[0].accessLevel!=undefined){
						  var uuid = hat(bits=512);
						  queryString = 'INSERT INTO authentication SET time_start=?, time_end=?, token=?, users_UserID=?';
						  var date = new Date();
						  var startTime = date.getTime();
						  var endTime = date.getTime() + time_two_weeks;
						  var access = rows[0].accessLevel;
						  var firstname = rows[0].members_firstname;
						  var userID = rows[0].UserID;
						  var expires = endTime - startTime;
						  global.connection.query(queryString, [startTime, endTime, uuid, userID], function(err, rows, fields){
						  	if(err){
						  		 console.log(err);
						  		 json = {authenticated:'false'};
								 res.send(prefix+JSON.stringify(json));
						  	}
						  	else{
						  		json = {token:uuid, accessLevel:access, username:req.headers.username, name:firstname, userID:userID, expires:expires};
								res.send(prefix+JSON.stringify(json));
						  	} 
						  });
						}
					}
				});
			
			});
		}
	});
});

router.get('/loginCookie', function(req, res){
	authenticate(req.headers.authentication, req.headers.userid, function(valid){
		var prefix = ")]}',\n";
		var json = '';
		if(valid){
			var queryString = 'SELECT accessLevel, members_firstname, username FROM users, authentication, members WHERE token=? '+
								'AND authentication.users_UserID=? AND authentication.users_UserID=UserID '+
								'AND members_MemberID=MemberID';
			global.connection.query(queryString, [req.headers.authentication, req.headers.userid], function(err, rows, fields){
				//TODO return unique identifier for login session
				if (err || rows[0]==undefined){
					console.log(err);
					json = {authenticated:'false'};
				}
				else{
					json = {authenticated:'true',accessLevel:rows[0].accessLevel, username:rows[0].username, name:rows[0].members_firstname, userID:req.headers.userid};
				}
				res.contentType('application/json');
				res.send(prefix+JSON.stringify(json));
			});
		}
		else{
			json = {authenticated:'false'};
			res.contentType('application/json');
			res.send(prefix+JSON.stringify(json));
		}
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
	authenticate(req.headers.authentication, req.headers.userid, function(valid){
		if(valid){
				var queryString = 'DELETE FROM authentication WHERE token=? AND users_UserID=?';
				var json = {authenticated:'false'};
				global.connection.query(queryString, [req.headers.authentication, req.headers.userid], function(err, rows, fields){
					if(err){
						console.log(err);
					}
					else{

					}
				});
				res.send(prefix+JSON.stringify(json));
		}
		else{
			var json = {authenticated:'false'};
			res.send(prefix+JSON.stringify(json));
		}
	});
});

router.get('/wards', function(req, res){
	authenticate(req.headers.authentication, req.headers.userid, function(valid){
		if(valid){
			var queryString = 'SELECT WardID, wards_name, stakes_name FROM wards, stakes, wards_has_users, users WHERE UserID=? AND '
							+'WardID=wards_WardID AND UserID=users_UserID AND StakeID=stakes_StakeID';
			var wardsArray = [];
			var prefix = ")]}',\n";
			global.connection.query(queryString, [req.headers.userid], function(err, rows, fields){
				if (err || !rows){
					res.redirect('/Error/:status=500');
				}
				else{
					for(var i in rows){
						var object = {id:rows[i].WardID, 'ward':rows[i].wards_name, 'stake':rows[i].stakes_name};
						wardsArray[i] = object;
					}
					res.send(prefix+JSON.stringify(wardsArray));
				}
			});
		}
		else{
			res.redirect('/Error/:status=401');
		}
	});
});

router.get('/directoryPreview', function(req, res){
	authenticate(req.headers.authentication, req.headers.userid, function(valid){
		if(valid){
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
		}
		else{
			res.redirect('/Error/:status=401');
		}
	});
});

router.get('/directory', function(req, res){
	authenticate(req.headers.authentication, req.headers.userid, function(valid){
		if(valid){
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
		}
		else{
			res.redirect('/Error/:status=401');
		}
	});
});

var authenticate = function(uuid, userID, callback){
	var queryString = 'SELECT time_end FROM authentication WHERE token=? AND users_userID=?';
	global.connection.query(queryString, [uuid, userID], function(err, rows, fields){
		if(err || !rows || !rows[0]){
			console.log(err);
			callback(false);
		}
		else{
			var date = new Date();
			var time = date.getTime();
			if(rows[0].time_end > time){
				callback(true);
			}
			else{
				callback(false)
			};
		}
	});
}

module.exports = router;