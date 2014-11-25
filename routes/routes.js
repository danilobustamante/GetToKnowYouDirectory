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
	//TODO query database for authentication
	res.writeHead(200, {'Authentication':'false'});
	res.send();
});

module.exports = router;