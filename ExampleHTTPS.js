var https = require('https')
var pem = require('pem')
var express = require('express')

//create express web server
var app = express()

pem.createCertificate({days:1, selfSigned:true}, function(err, keys){
	var https_server = https.createServer({key: keys.serviceKey, cert: keys.certificate}, app)
	//listen for requests
	var server = https_server.listen(8080, function () {

		var host = server.address().address
		var port = server.address().port

		console.log('Example Design using HTTPS at https://%s:%s',host,port) 

	})
})

//create https server

//routing information
app.get('/', function(req, res){
    res.send("Hi, My name is Matthew")
  })
