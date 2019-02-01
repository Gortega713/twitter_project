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
var queryString = require('querystring'); // Core module

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

app.get('/auth/twitter', authenticator.redirectToTwitterLoginPage); 
// Creates another route, can't do multiple of the same routes. 
// Send in consumer tokens and get a request token in return. That token
// is then going to allow us to "use" the APIs

app.get(url.parse(config.oauth_callback).path, function (req, res) {
    authenticator.authenticate(req, res, function (err) {
        if (err) {
            console.log(err); // debug
            res.sendStatus(401); // User-Error (Something was not found, send request back)
        } else {
            res.send("Authentication Successful!");
        }
    });
}); // Twitter is going to need to call us back 

app.get('/tweet', function (req, res) {
    var credentials = authenticator.getCredentials();
    if (!credentials.access_token || !credentials.access_token_secret) {
        res.sendStatus(401);
    }
    var url = "https://api.twitter.com/1.1/statuses/update.json";
    authenticator.post(url, credentials.access_token, credentials.access_token_secret, 
                      {
        status: "Today is Wednesday! That means Open Lab and Capstone groups! Hopefully everything runs smoothly and we create an awesome website for Precision Machining. " // Status = Tweet
    }, function (error, data) {
        if (error) {
            return res.status(400).send(error);
        } else {
            res.send("Tweet Successful!");
        }
    });
}); // Create new route

app.get('/search', function (req, res) {
    var credentials = authenticator.getCredentials();
    if (!credentials.access_token || !credentials.access_token_secret) {
        return res.sendStatus(418); // On the way out of function (Failure), send status code message
    } 
    var url = "https://api.twitter.com/1.1/search/tweets.json"; // Ready to push into generic "GET"
    var query = queryString.stringify({ q: 'Ariana Grande'}); // Format in a way to put into url
    url += '?' + query; // Set up URL with spaces, question marks, etc. Basically format it from JSON
    authenticator.get(url, credentials.access_token, credentials.access_token_secret, function (error, data) {
        if (error) {
            return res.status(400).send(error); // On failure, leave function and send out error to page.
        }
        res.send(data);
    });
}); // Create new route

app.get('/friends', function (req, res) {
    /* Copied from ^ search endpoint */
    var credentials = authenticator.getCredentials();
    if (!credentials.access_token || !credentials.access_token_secret) {
        return res.sendStatus(418); // On the way out of function (Failure), send status code message
    } 
    var url = "https://api.twitter.com/1.1/friends/list.json"; // Ready to push into generic "GET"
    if (req.query.cursor) {
        // If its a cursor collection?
        url += '?' + queryString.stringify({ cursor: req.query.cursor}); // Set up URL with spaces, question marks, etc. Basically format it from JSON
         // Cursor = "Filter"
    }
    authenticator.get(url, credentials.access_token, credentials.access_token_secret, function (error, data) {
        if (error) {
            return res.status(400).send(error); // On failure, leave function and send out error to page.
        }
        res.send(data);
    });
});

app.listen(config.port, function () {
    console.log("Server listening on localhost:%s", config.port); // "%s" is a placeholder for the variable put in next
    console.log("OAuth callback:%s", url.parse(config.oauth_callback).hostname + url.parse(config.oauth_callback).path);
}); // Creates server




















