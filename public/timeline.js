/*
Author: Gabriel Ortega
Date: 3.4.19

Filename: timeline.js // setup event listener for retweet button
*/

var tweets = document.getElementsByClassName("friend");

for (var i = 0; i < tweets.length; i++) {
    tweets[i].addEventListener("click", retweet, false);
}

function retweet() {
    var twitter_id = encodeURIComponent(document.getElementById('retweet').getAttribute("twitter_id"));
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            var response = JSON.parse(xhttp.responseText || {});
            window.alert(response);
        }
    }
    xhttp.open('GET', 'https://api.twitter.com/1.1/statuses/retweet/' + twitter_id + '.json');
    xhttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
//    xhttp.setRequestHeader('Access-Control-Allow-Origin', 'https://api.twitter.com');
    xhttp.send();
}




