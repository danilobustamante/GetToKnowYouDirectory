var mysql = require('mysql');

var Database = function(host,user,password,db){
	this.host = host;
	this.user = user;
	this.password = password;
	this.db = db;
};

Database.prototype.start = function(){
	console.log('Creating Connection Criteria for '+this.host+':'+this.user);
	var connection = mysql.createConnection({
		host : this.host,
		user : this.user,
		password : this.password,
		database : this.db
	});
	console.log('Connecting to the database');
	connection.connect(function(err) {
		if(err){
			console.log('Failed to Connect to Database:'+err);
			throw err;
		}
		else{
			console.log('Connected to Database');
		}
	});
	return connection;
};

module.exports = Database;

