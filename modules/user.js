
//constructor
var User = function(){
	this.id = -1;
	this.username = 'default';
	this.password = 'default';
	this.email = 'default';
	this.accessLevel = -1;
};

//class methods
User.prototype.readInUser = function(username, password){
	//go to database and read in a user given the username and password

};

User.prototype.createUser = function(username, password, email, accessLevel){
	//add user

};