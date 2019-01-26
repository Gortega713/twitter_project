/*
Author: Gabriel Ortega
Date: 1.17.19

Filename: index.js // Entry point for node project
*/

var express = require('express'); // In order to make use of express framework, bring it in; synchronous
var app = express(); // Creates a new application which we can use all of the functions; synchronous
var authenticator = require('./authenticator.js'); // 
var config = require('./config.json'); // Bring module through
var url = require('url'); // Middleware

/* 
What is middleware?
Route = Path/Endpoint
A function which we mount into a route. Between the start and the end, we want a function that is avaiable to us between a request and a response.  
If you have middleware, it is going to modify data which means that you need it back as a response
*/

app.use(require('cookie-parser')()); // Middleware is available to root (default), 
// "USE" is usually used to mount middleware. "USE" is only available to 
// code that is after this. Evaluates to an object.

// Process: Hits "USE" then evaluates next expression. No first param so default is "/". Moves on to "cookie-parser" which is then evaluated to a function. 
// The function is then evaluated to an actual function name. The next piece "()" evaluates to a function call

app.get('/', function (req, res) {
    res.send("<h3>Hello World</h3>"); // Sends something back as a response if successful
}); // Routes HTTP request to a specific path, path is root. 

app.get('/auth/twitter', authenticator.redirectToTwitterLoginPage) 
// Creates another route, can't do multiple of the same routes. 
// Send in consumer tokens and get a request token in return. That token
// is then going to allow us to "use" the APIs

app.get('/auth/callback', function (req, res) {
    res.send("This route will handle OAuth as a callback"); // Response on page
}); // Twitter is going to need to call us back 

app.listen(config.port, function () {
    console.log("Server listening on localhost:%s", config.port); // "%s" is a placeholder for the variable put in next
}); // Creates server