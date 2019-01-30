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
    oauth_token_secret: "",
    access_token: "",
    access_token_secret: "",
    twitter_id: ""
}

module.exports = {
    getCredentials: function () {
      return twitterCredentials; // Grab JSON object  
    },
    // url = API URL
    // GET = getting something
    get: function (url, access_token, access_token_secret, callback) {
        oauth.get.call(oauth, url, access_token, access_token_secret, callback); // Method given by OAUTH // Forward everything we passed in from function call so that way this object can use the same stuff
    },// Making something
    post: function (url, access_token, access_token_secret, body, callback) {
        oauth.post.call(oauth, url, access_token, access_token_secret, body, callback); // ^ Look at GET comment
    },
    redirectToTwitterLoginPage: function (req, res) {
        oauth.getOAuthRequestToken(function (error, oauth_token, oauth_token_secret, results) {
            if (error) { // Failure
                console.log(error);
                res.send("Authentication Failed!"); // Response for the page
            } else { // Success
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
        if (!(twitterCredentials.oauth_token && 
              twitterCredentials.oauth_token_secret && 
              req.query.oauth_verifier)) {
            return callback("Request does not have all required keys");
        }
        oauth.getOAuthAccessToken(twitterCredentials.oauth_token, 
                                  twitterCredentials.oauth_token_secret, 
                                  req.query.oauth_verifier, 
                                  function (error, oauth_access_token, oauth_access_token_secret, results) {
            if (error) {
                return callback(error);
            }
            oauth.get('https://api.twitter.com/1.1/account/verify_credentials.json', 
                      oauth_access_token, oauth_access_token_secret, 
                      function (error, data) {
                if (error) {
                    console.log(error);
                    return callback(error) // Pull the plug
                 }
                data = JSON.parse(data);
                twitterCredentials.access_token = oauth_access_token;
                twitterCredentials.access_token_secret = oauth_access_token_secret;
                twitterCredentials.twitter_id = data.id_str; // JSON data that has been parsed. This means we can use it
//                console.log(twitterCredentials);
                callback();
            }); 
             // Not "GET" from ExpressJS/NodeJS [Callback: We are going to call you back and give you either an error or data]
             // ^ Target resource in API, TRADE | oauth access token, oauth_access_token_secret | FOR | Access Tokens | FOR | Access to API which gives us data on profile
        });
    }
}













