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
); // Build new object from module

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
            }
            /* 
            Using object from above and use our consumer token and secret. 
            Returns a request token and results. Trading credentials.
            Names from OAuth object have to be the same. This is how the function is going to work.
            */
        }); 
        
    }
}