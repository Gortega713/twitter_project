/*
Author: Gabriel Ortega
Date: 1.24.19

Filename: authenticator.js // Authenticates twitter app
*/

var OAuth = require('oauth').OAuth; // Grabs specific exported variable from object/module
var config = require('./config.json'); // Bring module from local directory (has twitter keys)

var oauth = new OAuth(
    config.request_token_url,
    config.access_token_url,
    config.consumer_key,
    config.consumer_secret,
    config.oauth_version,
    config.oauth_callback,
    config.oauth_signature
); // Build new object from module, separate from JSON object in config.json

var twitterCredentials = {
    oauth_token: "",
    oauth_token_secret: ""
}

module.exports = {
    redirectToTwitterLoginPage: function (req, res) {
        oauth.getOAuthRequestToken(function (error, oauth_token, oauth_token_secret, results) {
            if (error) {
            // Failure
                console.log(error);
                res.send("Authentication Failed!"); // Response for the page
            } else {
            // Success
                twitterCredentials.oauth_token = oauth_token;
                twitterCredentials.oauth_token_secret = oauth_token_secret;
                res.redirect(config.authorize_url + '?oauth_token=' + oauth_token); // Go somewhere else as a resposne
                // Authentication is in place, Authorization is not yet in place.
            }
            /* 
            Using object from above and use our consumer token and secret. 
            Returns a request token and results. Trading credentials.
            Names from OAuth object have to be the same. This is how the function is going to work.
            */
            /*
            Responses can only provide one route, once. Trying to request multiple responses from the same route will error out. 
            */
        }); 
        
    },
    authenticate: function(req, res, callback) {
        //twitterCredentials.oauth_token=""; // debug
        // twitterCredentials.oauth_token_secret=""; // debug
        if (!(twitterCredentials.oauth_token && twitterCredentials.oauth_token_secret && req.query.oauth_verifier)) {
            return callback("Request does not have all required keys");
        }
        twitterCredentials.oauth_token="";
        twitterCredentials.oauth_token_secret="";
        oauth.getOAuthAccessToken(twitterCredentials.oauth_token, twitterCredentials.oauth_token_secret, req.query.oauth_verifier, function (error, oauth_access_token, oauth.access_token_secret, results) {
            if (error) {
                return callback(error);
            }
        });
    }
}













