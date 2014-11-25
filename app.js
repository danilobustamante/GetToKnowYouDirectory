var express = require('express');
var app = express();
var router = require('./routes/routes.js');
var path = require('path');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

/*app.get('/', function(req, res){
	res.send("Welcome to express Server");
});*/

app.use('/', router);
app.use('/login', router);

app.listen(3000, function() {
	console.log('Express Server Listening on Port 3000');
});

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

/*var mysql = require('mysql');
var connection = mysql.createConnection({
	host : 'localhost',
	user : 'root',
	password : 'Uruguay2011!',
	database : 'mydb'
});

console.log('Connecting');
connection.connect();
console.log('connected');

var data = {username:'matthewjcannon',password:'matt',email:'tomballmjc@gmail.com'};
var queryString = 'INSERT INTO users SET ?'
connection.query(queryString, data, function(err){
	if (err) console.log('error');
});

var queryString = 'SELECT * FROM users';
connection.query(queryString, function(err, rows,fields){
	if (err) console.log('error');

	for(var i in rows){
		console.log('id', rows[i].UserID);
		console.log('users', rows[i].username);
		console.log('password', rows[i].password);
		console.log('email', rows[i].email);
	}
});
connection.end();
console.log('connection destroyed');*/