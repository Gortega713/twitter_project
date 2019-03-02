/*
Author: Gabriel Ortega
Date: 1.17.19

Filename: index.js // Entry point for node project
*/

var express = require('express'); // In order to make use of express framework, bring it in; synchronous
var bodyParser = require('body-parser'); // Capable of parsing out request bodies
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var app = express(); // Creates a new application which we can use all of the functions; synchronous
var authenticator = require('./authenticator.js'); // 
var config = require('./config.json'); // Bring module through
var url = require('url'); // Middleware
var queryString = require('querystring'); // Core module
var async = require('async');
var storage = require('./storage.js');
storage.connect();

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

app.use(bodyParser.json()); // Parses into JSON

app.set('view engine', 'ejs'); // Anything that has an ejs extension on it will be seen by our engine.
// "views" = parts of UI. What programmers have decided to give users

setInterval(function() {
    if (storage.connected()) {
        console.log("Clearing MongoDB cache.");
        storage.deleteFriends();
    }
}, 1000 * 60 * 5); // Delete friends every 5 minutes

//app.get('/', function (req, res) {
//    res.send("<h3>Hello World</h3>"); // Sends something back as a response if successful
//}); // Routes HTTP request to a specific path, path is root. 

app.get('/auth/twitter', authenticator.redirectToTwitterLoginPage);
// Creates another route, can't do multiple of the same routes. 
// Send in consumer tokens and get a request token in return. That token
// is then going to allow us to "use" the APIs

app.get(url.parse(config.oauth_callback).path, function (req, res) {
    authenticator.authenticate(req, res, function (err) {
        if (err) {
            res.redirect('/login'); // Error on authentication
        } else {
            res.redirect('/'); // Show us all friends
        }
    });
}); // Twitter is going to need to call us back 

app.get('/tweet', function (req, res) {
    var credentials = authenticator.getCredentials();
    if (!credentials.access_token || !credentials.access_token_secret) {
        res.sendStatus(401);
    }
    var url = "https://api.twitter.com/1.1/statuses/update.json";
    authenticator.post(url, credentials.access_token, credentials.access_token_secret, {
        status: "Today is Wednesday! That means Open Lab and Capstone groups! Hopefully everything runs smoothly and we create an awesome website for Precision Machining. " // Status = Tweet
    }, function (error, data) {
        if (error) {
            return res.status(400).send(error);
        } else {
            res.send("Tweet Successful!");
        }
    });
}); // Create new route

app.get('/timeline', function (req, res) {
    var credentials = authenticator.getCredentials();
    if (!credentials.access_token || !credentials.access_token_secret) {
        res.sendStatus(401);
    }
    var url = "https://api.twitter.com/1.1/statuses/home_timeline.json"; // Resource URL
    authenticator.get(url, credentials.access_token, credentials.access_token_secret, function (error, data) { // data = timeline
        if (error) {
            return res.status(400).send(error); // On failure, leave function and send out error to page.
        }
        data = JSON.parse(data);
    data = data.map(function (tweet) {
        return { // Return custom JSON object with things that I actually need
            myID: credentials.access_token,
            twitter_id: tweet.id_str,
            text: tweet.text,
            name: tweet.user.name,
            location: tweet.user.location,
            profile_image_url: tweet.user.profile_image_url,
            date_created: tweet.created_at
        }
    });
    res.render('timeline', { tweets: data }); // Sends data to ejs file
    });
});

app.get('/search', function (req, res) {
    var credentials = authenticator.getCredentials();
    if (!credentials.access_token || !credentials.access_token_secret) {
        return res.sendStatus(418); // On the way out of function (Failure), send status code message
    }
    var url = "https://api.twitter.com/1.1/search/tweets.json"; // Ready to push into generic "GET"
    var query = queryString.stringify({
        q: 'Ariana Grande'
    }); // Format in a way to put into url
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
        // If its a cursored collection. A collection that can be read through as pages. Next "page" is next "cursor"
        url += '?' + queryString.stringify({
            cursor: req.query.cursor
        }); // Set up URL with spaces, question marks, etc. Basically format it from JSON
        // Cursor = "Filter" / If there is more than one page, every next url will have a cursor pointing to the next page of data
    }
    authenticator.get(url, credentials.access_token, credentials.access_token_secret, function (error, data) {
        if (error) {
            return res.status(400).send(error); // On failure, leave function and send out error to page.
        }
        res.send(data);
    });
});

app.get('/', function (req, res) {
    var credentials = authenticator.getCredentials();
    if (!credentials.access_token || !credentials.access_token_secret) {
        return res.redirect('/login');
    }
    console.log(credentials.twitter_id);
    if (!storage.connected()) {
        console.log("Loading friends from Twitter");
        renderMainPageFromTwitter(req, res);
    }
    
    console.log("Loading data from MongoDB");
    storage.getFriends(credentials.twitter_id, function (err, friends) {
        if (err) {
            return res.status(500).send(err);
        }
        if (friends.length > 0) {
            console.log("Friends successfully loaded from MongoDB");
            friends.sort(function (a, b) {
                return a.name.toLowerCase().localeCompare(b.name.toLowerCase()); // Coming from JSON object
            }); // Sort will compare one to the other and swap them depending on the params
            res.render('index', { friends: friends})
        } else {
            console.log("Loading friends from Twitter");
            renderMainPageFromTwitter(req, res);
        }
    });
});

function renderMainPageFromTwitter (req, res) {
    //credentials
    var credentials = authenticator.getCredentials();
    // Get friends IDs // Get back 5000 at a time

    /*
    Notes: 
    What is a waterfall? 
    A waterfall is a method of the async package which allows for asynchronous code to be executed synchronously. It takes in
    an array of functions which will have their results passed on to the next as soon as they finish (the synchronous part). The next parameter is basically 
    a callback which will run as soon as the tasks inside of the waterfall are completed. 
    */


    async.waterfall([
       //get friends ids
       function (callback) {
            var cursor = -1; // Cursor starts at beginning of collection
            var ids = []; // Holding zone for IDs, New starting point each request
            console.log("ids.length: " + ids.length);
            //async whilst loop (first parameter value that returns true or false)
            async.whilst(function () { // Not a callback. Always checking whilst condition.
                    //As long as not equal to zero whilst loop will run
                    return cursor != 0; // 0 = End of collection
                    // Returns friends IDs by using an API call
                    // First parameter is a condition. The function will grab cursor and tell the function if it is equal to 0 or not.
                    // If it is, stop function, if not, keep running.
                },
                function (callback) { // Iteration function for Whilst
                    var url = 'https://api.twitter.com/1.1/friends/ids.json'; // Ready to push into generic "GET"
                    url += '?' + queryString.stringify({
                        user_id: credentials.twitter_id,
                        cursor: cursor
                    });
                    // Stringifys JSON object
                    // querystring = NPM package. Stringify = Parses url with pieces that we need (Percents, encodings, etc.)  
                    // User_ID = US. We use our credentials
                    authenticator.get(url, credentials.access_token, credentials.access_token_secret, function (error, data) {
                        // GET is using our URL ^^^^ from Twitter API call. 
                        if (error) {
                            return res.status(400).send(error); // Get out of function and send status
                        }
                        data = JSON.parse(data); // Make JSON object into something that is able to be used
                        cursor = data.next_cursor_str; // Move forward into data set
                        //In the end have array with friends (ids concatenated with data)
                        ids = ids.concat(data.ids);
                        console.log('ids.length: ' + ids.length);
                        callback();
                    }); // Use API call
                }, // Method (whilst) of async object(async.) // Loop. Basically the async version of while.
                // Look up friends data // Can look up 100 friends at a time
                function (error) { // Callback for Whilst
                    if (error) {
                        return res.status(500).send(error);
                    }
                    console.log(ids);
                    callback(null, ids);
                });
           }, // Next function in waterfall
       function (ids, callback) {
            var getHundredIds = function (i) {
                // Building our own point in array
                /*
                Notes on Math: (This function will be used in async.times loop (basically a FOR loop))
                First iteration will be zero. Start at "0" of friends. Then, take the array, and get another 100 ids each time.
                Literally slice each 100
                */
                return ids.slice(100 * i, Math.min(ids.length, 100 * (i + 1))); // First param is start, second is how much we want to take
                // Grabbing us the smallest of the two. Whole lotta math, doesnt really matter
            };
            var requestsNeeded = Math.ceil(ids.length / 100); // Rounds UP. (493 friends [length] / 100) 4.93 => 5 request needed
            /*
            Notes: 
            // First param, # of iterations
            // Second param, function to repeat for each iteration, 
               param (n) = iteration(s) / param (next) = placeholder for a function to run (callback)
            */

            async.times(requestsNeeded, function (n, next) {
                // Reason: look up friend data. 
                // Take 100 IDs at a time, send it to an API call, get data back
                var url = "https://api.twitter.com/1.1/users/lookup.json"; // Cursored collection
                url += "?" + queryString.stringify({ // Format for URL, Feed a json object
                    user_id: getHundredIds(n).join(', ') // Turns array into a string
                }); 
                authenticator.get(url, credentials.access_token, credentials.access_token_secret, function (error, data) {
                    if (error) {
                        return res.status(400).send(error); // Status = us / error = Twitter
                    }
                    var friends = JSON.parse(data);
                    next(null, friends); // First param is error, second is data
                    
                })
            }, function (error, friends) { // Next parameter in async.times, will run on NEXT ^
                friends = friends.reduce(function (previousValue, currentValue, // Getting back a multidimensional array , turn it into a regular array
                                                   currentIndex, array) { // Runs a function on each element in an array
                    return previousValue.concat(currentValue); // Telling reduce WHAT to do
                }, []); // Producing us a new array on result. Complicated but it doesn't matter. Look it up
                friends.sort(function (a, b) {
                    // We have to tell the sort method, HOW to sort
                    return a.name.toLowerCase().localeCompare(b.name.toLowerCase()); // JSON object has "name" value
                });
                friends = friends.map(function (friend) {
                    // Convert stuff from friends that can be passed into EJS and easily read in new file
                    // Return a custom JSON object
                    return {
                        twitter_id: friend.id_str,
                        for_user: credentials.twitter_id,
                        name: friend.name,
                        screen_name: friend.screen_name,
                        location: friend.location,
                        profile_image_url: friend.profile_image_url
                    }
                }); // runs a function on each element, returns a new array with new values from function
                res.render('index', { friends: friends }); // redner is how you bring in the web page and join server with web page       
                if (storage.connected()) {
                    storage.insertFriends(friends);
    }  
            });
       }
   ]);
}; // Create a new endpoint (use for either "GET" or "POST") Finds OUR route


app.get('/login', function (req, res) {
    if (storage.connected()) {
        console.log("Deleting friends collection on login");
        storage.deleteFriends(); // Deletes entire collection
    }
    res.render('login'); // Bring me up a valid web page, need to use view engine, view engine = ejs.
}); // Create new route

app.get('/logout', function (req, res) {
    authenticator.clearCredentials(); // On way back to logIN, remove credentnials
    res.clearCookie('twitter_id');
    if (storage.connected()) {
        console.log("Deleting friends collection on logout");
        storage.deleteFriends(); // Deletes entire collection
    }
    res.redirect('login'); // Bring me up a valid web page, need to use view engine, view engine = ejs.
}); // Create new route

// Middleware require req, res, and next
function ensureLogin (req, res, next) {
    var credentials = authenticator.getCredentials(); // Hold tokens and IDs
    if (!credentials.access_token || !credentials.access_token_secret || !credentials.twitter_id) {
        return res.sendStatus(401);
    }
    res.cookie('twitter_id', credentials.twitter_id, {
        httponly: true
    }); // Sets cookies
    next();
}

app.get('/friends/:uid/notes', ensureLogin, function (req, res, next) {
    var credentials = authenticator.getCredentials();
    storage.getNotes(credentials.twitter_id, req.params.uid, function(error, notes) {
        if (error) {
            return res.sendStatus(500).send(error)
        }
        res.send(notes);
    });
//    return res.sendStatus(200);
});

/* In order to post a note, we need to set off a post. The route is set up to recieve post */
app.post('/friends/:uid/notes', ensureLogin, function (req, res, next) {
    storage.insertNote(req.cookies.twitter_id, req.params.uid, req.body.content, function (err, note) {
        if (err) {
            return res.status(500).send(err);
        }
        res.send(note);
    });
}); // We use POST because we are sending information, use AJAX to send request

app.get('/retweet/:id', ensureLogin, function (req, res) {
    var id = req.params.id;
    var url = "https://api.twitter.com/1.1/statuses/retweet/" + encodeURIComponent(id);
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            var successResponse = JSON.parse(xhttp.responseText || []);
        }
    }
    xhttp.open('POST', url + ".json", true);
    xhttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhttp.send();
});

// PUT = update
app.put('/friends/:uid/notes/:noteid', ensureLogin, function (req, res) {
    console.log('app.put()', req.cookies);
    var noteID = req.params.noteid;
    storage.updateNote(noteID, req.cookies.twitter_id, req.body.content, function (err, note) { // failure / success
        if (err) {
            return res.status(500).send(err);
        }
        res.send({
            _id: note._id,
            content: note.content
        });
    });
});

app.delete('/friends/:uid/notes/:noteid', ensureLogin, function (req, res) {
    console.log('app.delete()', req.cookies);
    var noteID = req.params.noteid;
    storage.deleteNote(noteID, req.cookies.twitter_id, function (err, note) { // Error or copy of note that we deleted
        if (err) {
            return res.status(500).send(err);
        }
        res.sendStatus(200);
    });
});

app.use(express.static(__dirname + '/public')); // Route defaults to root

app.listen(config.port, function () {
    console.log("Server listening on localhost:%s", config.port); // "%s" is a placeholder for the variable put in next
    console.log("OAuth callback:%s", url.parse(config.oauth_callback).hostname + url.parse(config.oauth_callback).path);
}); // Creates server














