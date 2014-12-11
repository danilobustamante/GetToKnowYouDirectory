var express = require('express');
var hat = require('hat');
var crypto = require('crypto');
var consts = require('./../data/consts');
var router = express.Router();
var json = require('json');
var time_two_weeks = 60*60*24*14*1000;
var async = require('async');

router.get('/', function(req, res){
	//res.send('Hello from the Router');
	/*res.render('index', {
    env: 'dev',
    title: 'YSA Ward Directory'
  });*/
	res.status(200).sendFile('./public/index.html');
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
						  var expires = time_two_weeks/1000;
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
router.post('/addAdmin', function(req, res){
	var prefix = ")]}',\n";
	var json = {username:false, email:false};
	res.contentType('application/json');
	//authenticate
	authenticate(req.body.token, req.body.userID, function(valid){
		if(valid){
			//check to see if email or username are already in use
			var queryString = 'SELECT username, email FROM users WHERE username=? OR email=?';
			global.connection.query(queryString, [req.body.newuser, req.body.email], function(err, rows, fields){
				console.log(rows);
				if(err){
					console.log(err);
					res.status(500).send();
				}
				else if(rows[0]){
					for(var i in rows){
						if(rows[i].username===req.body.newuser) json.username=true;
						if(rows[i].email===req.body.email) json.email=true;
						console.log(json);
					}
					res.send(prefix+JSON.stringify(json));
				}
				else{
					var queryString = 'SELECT accessLevel FROM users WHERE UserID=?';
					global.connection.query(queryString, [req.body.userID], function(err, rows, fields){
						if(err || !rows){
							console.log(err);
							res.status(500).send();
						}
						else{
							var level = rows[0].accessLevel;
							if(level === consts.adminAccess) level=-1;
							else if(level === consts.otherAccess) level=level-1;
							if(level < req.body.access){
								global.connection.beginTransaction(function(err) {
									if(err) {console.log(err); res.status(500).send();}
									else{
										var queryString = 'INSERT INTO members SET members_firstname=?, members_lastname=?, wards_WardID=?';
										global.connection.query(queryString, [req.body.firstname, req.body.lastname, req.body.wardID], function(err, info){
											if(err || !info){
												console.log(err);
												global.connection.rollback(function() { });
												res.status(500).send();
											}
											else{
												var membersID = info.insertId;
												if(!membersID){
													global.connection.rollback(function() { });
													res.status(500).send();
												}
												var salt = crypto.randomBytes(128).toString('base64');
												crypto.pbkdf2(req.body.password, salt, 10000, 512, function(err, derivedKey) {
													if(err){
														console.log(err);
														global.connection.rollback(function() { });
														res.status(500).send();
													}
													else{
														var queryString = 'INSERT INTO users SET username=?, password=?, password_salt=?, email=?, accessLevel=?, members_MemberID=?';
														global.connection.query(queryString, [req.body.newuser, derivedKey.toString('base64'), salt, req.body.email, req.body.access, membersID], function(err, info){
															if(err || !info){
																console.log(err);
																global.connection.rollback(function() { });
																res.status(500).send();
															}
															else{
																queryString = 'INSERT INTO wards_has_users SET wards_WardID=?, users_UserID=?';
																var usersID = info.insertId;
																if(!usersID){
																	global.connection.rollback(function() { });
																	res.status(500).send();
																}
																global.connection.query(queryString, [req.body.wardID, usersID], function(err, info){
																	if(err){
																		console.log(err);
																		global.connection.rollback(function() { });
																		res.status(500).send();
																	}
																	else{
																		connection.commit(function(err) {
																	        if (err) { 
																	          global.connection.rollback(function() { });
																	          res.status(500).send();
																	        }
																	        else{
																	        	res.send(prefix+JSON.stringify(json));
																	        }
																	    });
																	}
																});
															}
														});
													}
												});
											}
										});
									}
								});	
							}
							else{
								res.status(401).send();
							}
						}
					});
				}
			});
		}
		else res.status(401).send();
	});
});

router.get('/adminAddPrivleges', function(req, res){
	authenticate(req.headers.authentication, req.headers.userid, function(valid){
		if(valid){
			var queryString = 'SELECT accessLevel FROM users WHERE UserID=?';
			var privelegeArray = [];
			var prefix = ")]}',\n";
			res.contentType('application/json');
			var json = {authenticated:false};
			global.connection.query(queryString, [req.headers.userid], function(err, rows, fields){
				if (err || !rows || !rows[0]){
					console.log(err);
					res.status(500).send();
				}
				else{
					var level = rows[0].accessLevel;
					//grant admin privleges to admins
					if(level===consts.adminAccess) level=-1;
					else if(level===consts.otherAccess) level=level-1;
					var queryString = 'SELECT AccessID, access_type FROM access WHERE AccessID>?';
					global.connection.query(queryString, [level], function(err, rows, fields){
						if(err || !rows){
							console.log(err);
							res.status(500).send();
						}
						else{
							for(var i in rows){
								var object = {id:rows[i].AccessID, 'name':rows[i].access_type};
								privelegeArray[i] = object;
							}
							res.send(prefix+JSON.stringify(privelegeArray));
						}
					});
				}
			});
		}
		else res.status(401).send();
	});
});

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
			var queryString = 'SELECT MemberID, members_firstname, members_lastname, imageLocation FROM members, wards WHERE ' +
								'wards_name=? AND wards_WardID = WardID';
			var prefix = ")]}',\n";
			var membersArray = [];
			global.connection.query(queryString, [req.headers.ward], function(err, rows, fields){
				if (err || !rows){
					res.redirect('/500Error');
				}
				else{
					for(var i in rows){
						var object = {'id':rows[i].MemberID, 'firstname':rows[i].members_firstname, 'lastname':rows[i].members_lastname, 'img':rows[i].imageLocation};
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

router.get('/surveyTimes', function(req, res){
	authenticate(req.headers.authentication, req.headers.userid, function(valid){
		if(valid){
			var queryString = 'SELECT start_time, end_time FROM survey WHERE wards_wardID=?';
			var prefix = ")]}',\n";
			global.connection.query(queryString, [req.headers.wardid], function(err, rows, fields){
				if (err || !rows || rows[0]===undefined || !rows[0].start_time || !rows[0].end_time){
					console.log(err);
					res.status(500).send('Internal Server Error');
				}
				else{
					var json = {'start_time':rows[0].start_time, 'end_time':rows[0].end_time};
					res.send(prefix+JSON.stringify(json));
				}
			});
		}
		else{
			res.status(401).send('Access Denied');
		}
	});
});

router.post('/surveyTimes', function(req, res){
	authenticate(req.body.Authentication, req.body.userID, function(valid){
		if(valid){
			var queryString = 'SELECT wards_WardID, users_UserID FROM wards_has_users WHERE wards_wardID=? AND users_UserID=?';
			global.connection.query(queryString, [req.body.wardID, req.body.userID], function(err, rows, fields){
				if (err){
					console.log(err);
					res.status(500).send('Internal Server Error');
				}
				else if(!rows || rows[0]===undefined || rows[0].wards_WardID!=req.body.wardID || rows[0].users_UserID!=req.body.userID){
					res.status(401).send('Access Denied');
				}
				else{
					queryString = 'UPDATE survey SET start_time=?, end_time=? WHERE wards_wardID=?';
					global.connection.query(queryString, [req.body.start_time, req.body.end_time,req.body.wardID], function(err, rows, fields){
						if(err){
							res.status(500).send('Internal Server Error');
						}
						else{
							res.status(200).send('OK');
						}
					});
				}
			});
		}
		else{
			res.status(401).send('Access Denied');
		}
	});
});

router.get('/surveysOpen', function(req, res){
	var date = new Date();
	var time = date.getTime();
	var queryString = 'SELECT WardID, wards_name, StakeID, stakes_name FROM stakes, wards, survey WHERE stakes_StakeID=StakeID '+
						'AND wards_WardID=WardID AND start_time<? AND end_time>?';
	var prefix = ")]}',\n";
	global.connection.query(queryString, [time,time], function(err, rows, fields){
		if(err){
			console.log(err);
			res.status(500).send();
		}
		else{
			res.send(prefix+JSON.stringify(rows));
		}
	});
});

router.get('/surveyMemberResponse', function(req, res){
	//authenticate
	authenticate(req.headers.authentication, req.headers.userid, function(valid){
		if(valid){
			var queryString = 'SELECT DISTINCT response, reference_name, questionIndex FROM survey_has_questions, ' +
								'questions, answers, members_has_answers WHERE members_MemberID=? AND ' +
								'answers_AnswerID=AnswerID AND answers.questions_QuestionID=QuestionID AND ' +
								'answers.questions_QuestionID=survey_has_questions.questions_QuestionID AND ' +
								'QuestionID=survey_has_questions.questions_QuestionID';
			global.connection.query(queryString, [req.headers.memberid], function(err, rows, fields){
				if(err){
					console.log(err);
					res.status(500).send();
				}
				else{
					var json = [];
					for(var i in rows){
						var object = {'index':rows[i].questionIndex, 'name':rows[i].reference_name, 'answer':rows[i].response};
						json[i] = object;
					}
					json.sort(compareIndex);
					var prefix = ")]}',\n";
					res.status(200).send(prefix+JSON.stringify(json));
				}
			});
		}
		else{
			res.status(401).send();
		}
	});
});

function compareIndex(a,b) {
  if (a.index< b.index)
     return -1;
  if (a.index > b.index)
    return 1;
  return 0;
}

router.post('/submitSurvey', function(req, res){
	//console.log(req.body.answers);
	try{
		var nameArray = req.body.name.split(' ');
		var first = nameArray[0];
		var last = nameArray[nameArray.length-1];
		//console.log(first);
		//console.log(last);
		if(nameArray.length<2) throw 'Only First Name Given';
		if(!req.body.wardID) throw 'No Ward ID given';
		var date = new Date();
		var time = date.getTime();
		var queryString = "SELECT wards_WardID FROM survey WHERE wards_WardID=? AND ?>start_time AND ?<end_time";
		global.connection.query(queryString, [req.body.wardID,time,time], function(err, rows, fields){
			if(err || !rows){
				throw err;
			}
			else if(rows[0].wards_WardID!=req.body.wardID){
				//console.log('Failed to wardID:'+rows[0]+':'+req.body.wardID);
				res.status(500).send();
			}
			else{
				global.connection.beginTransaction(function(err) {
					if(err){
						//console.log('Failed to INSERT start: '+err);
						global.connection.rollback(function() { });
						res.status(500).send();
					}
					else{
						queryString = "INSERT INTO members SET members_firstname=?, members_lastname=?, wards_WardID=?";
						global.connection.query(queryString, [first,last,req.body.wardID], function(err, info){
							if(err){
								//console.log('Failed to INSERT member: '+err);
								global.connection.rollback(function() { });
								res.status(500).send(err)
							}
							else{
								var membersID = info.insertId;
								//console.log('MembersID is:'+membersID);
								async.each(req.body.answers, addMemberHelper.bind(null,membersID), function(err){
									if(err){
										global.connection.rollback(function() { });
										res.status(500).send();
										return;
									}
									else{
										//console.log('committing changes to database');
										global.connection.commit(function(err) {
											if(err){
												global.connection.rollback(function() { });
												res.status(500).send
											}
											else{
												res.status(200).send();
											}
										});
									}
								});
								
							}
						});
					}
				});
			}
		});

	} catch(err){
		console.log('Caught Error: '+err);
		res.status(500).send(err);
	}
});

function addMemberHelper(membersID, array, callback) {
	queryString = "INSERT INTO answers SET response=?,questions_QuestionID=?";
	//console.log('Members:'+membersID);
	global.connection.query(queryString, [array.response, array.id], function(err, info){
		//console.log('query executed');
		if(err){
			//console.log('Failed to INSERT answer: '+err);
			callback(err);
			//global.connection.rollback(function() { });
			//res.status(500).send(err);
			//times = req.body.answers.length+1;

		}
		else{
			var answersID = info.insertId;
			//console.log(answersID);
			queryString = "INSERT INTO members_has_answers SET members_MemberID=?, answers_AnswerID=?";
			global.connection.query(queryString, [membersID, answersID], function(err, info){
				if(err){
					//console.log('Failed to INSERT shared: '+err);
					//global.connection.rollback(function() { });
					//res.status(500).send(err);
					callback(err);
				}
				else{
					callback();
				}
			});
		}
	});
}

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