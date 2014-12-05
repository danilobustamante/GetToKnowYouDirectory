var express = require('express');
var app = express();
var router = require('./routes/routes.js');
var path = require('path');
var prompt = require('prompt');
var Database = require('./data/database.js');
var crypto = require('crypto');


var db;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.listen(3000, function() {
	console.log('Express Server Listening on Port 3000');
});


/*Create Database*/
var schema = {
    properties: {
      host: {
        required: true
      },
      user: {
        required: true
      },
      password: {
        hidden: true,
        required: true
      },
      database: {
        required: true
      }
    }
  };

prompt.start();


//
// Get property values from console
//
prompt.get(schema, function (err, result) {
	//create database
	db = new Database(result.host, result.user, result.password, result.database);
	global.connection = db.start();
});



app.use('/', router);

/*Error Handling*/
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: err
	});
	//res.send('Error');
});

module.exports = app;
/*
var mysql = require('mysql');


console.log('Connecting');
connection.connect();
console.log('connected');

var queryString = 'TRUNCATE TABLE users';
connection.query(queryString, function(err){
	if (err) console.log(err);
});
var data = {username:'admin',password:'admin',email:'tomballmjc@gmail.com','accessLevel':0};
var queryString = 'INSERT INTO users SET ?'
connection.query(queryString, data, function(err){
	if (err) console.log(err);
});

var queryString = 'SELECT * FROM users';
connection.query(queryString, function(err, rows,fields){
	if (err) console.log('error reading data');

	for(var i in rows){
		console.log('id', rows[i].UserID);
		console.log('users', rows[i].username);
		console.log('password', rows[i].password);
		console.log('email', rows[i].email);
		console.log('accessLevel', rows[i].accessLevel);
	}
});
connection.end();
console.log('connection destroyed');*/