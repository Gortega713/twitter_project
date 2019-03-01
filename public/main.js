/*
Author: Gabriel Ortega
Date: 2.14.19

Filename: main.js // Hold IIFE - Immediately Invoked Function Expression, function will run from front end
*/

(function() {
    var selectedUserId;
    var cache = {};
    
    function startUp() { // Actually creates User Interface
        var friends = document.getElementsByClassName("friend"); // All dynamically created LIs // Should have 21
        for (var i = 0; i < friends.length; i++) {
            friends[i].addEventListener("click", function () {
                for (var j = 0; j < friends.length; j++) {
                    friends[j].className = 'friend';
                } // On each li, do something else
                this.className += ' active'; // Change CSS on click
                selectedUserId = this.getAttribute("uid");
                console.log("Twitter ID: ", selectedUserId);
                var notes = getNotes(selectedUserId, function (notes) {
                    var docFragment = document.createDocumentFragment(); // "Sticky Note" New node for other nodes. A container
                    var notesElements = createNoteElements(notes);
                    notesElements.forEach(function(element) {
                        docFragment.appendChild(element); // Each new fragment is going to be a new element from the array
                    }); // Grab each element and use a function on it
                    var newNoteButton = createAddNoteButton();
                    docFragment.appendChild(newNoteButton);
                    document.getElementById('notes').innerHTML = "";
                    document.getElementById('notes').appendChild(docFragment);
                    console.log(notes);
                }); // Not function from storage.js
            }); // shows Twitter ID on click
        }
    }
    
    function createNoteElements(notes) {
        return notes.map(function (note) {
            var element = document.createElement("li");
            element.className = "note";
            element.setAttribute("contenteditable", true); // content edit able
            element.textContent = note.content;
            element.addEventListener("blur", function () {
                note.content = this.textContent;
                if (note.content == "") {
                    if (note._id) { // actually in database
                        deleteNote(selectedUserId, note, function () {
                            document.getElementById('notes').removeChild(element);
                        });
                    } else {
                        document.getElementById('notes').removeChild(element);
                    }
                } else if (!note._id) { // Never been in database
                    postNewNote(selectedUserId, {content: this.textContent}, function (newNote) {
                        note._id = newNote._id; // give id to new note in order to put in database
                    });
                } else {
                    putNote(selectedUserId, note, function () {}); // EMPTY FUNCTION
                }
                console.log("blur");
            });
            element.addEventListener("keydown", function (e) {
                if (e.keyCode == 13) { // 13 = return
                    e.preventDefault(); // Default behavior is to put in a new line
                    if (element.nextSibling.className == "add-note") { // If last note, 
                        element.nextSibling.click() // element is add button. 
                    } else {
                        element.nextSibling.focus(); // element is next note
                    }
                }
            })
            return element; // Go into next loop
        }); // Transforms array into array of lis with certain structure
        return notes;
    }
    
    function createAddNoteButton() {
        var element = document.createElement("li");
        element.className = "add-note";
        element.textContent = "Add a New Note ...";
        element.addEventListener("click", function () {
            var noteElement = createNoteElements([{}])[0]; // Create note element
            document.getElementById("notes").insertBefore(noteElement, this);
            noteElement.focus();
        })
        return element;
    }
    
    function getNotes(userID, callback) {
        if (cache[userID]) {
            return callback(cache[userID]);
        }
        var xhttp = new XMLHttpRequest(); // First piece in AJAX sequence
        // Event property
        xhttp.onreadystatechange = function () {
            if (xhttp.readyState == 4 && xhttp.status == 200) { // 0-4, 4 = it has delivered everything it needs to
                // We will either have a response, or nothing, which is still good
                var notes = JSON.parse(xhttp.responseText || []); // Response which happens to be in JSON
                cache[userID] = notes; // Set associatively
                callback(notes);
            }
        }
        xhttp.open('GET', "/friends/" + encodeURIComponent(userID) + "/notes", true); // GET request // True = async
        xhttp.send(); // open = create structure, send = send
    }
    
    function postNewNote(userID, note, callback) {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                var serverNote = JSON.parse(xhttp.responseText || {}); // Expecting one JSON object instead of an array ^^
                cache[userID].push(serverNote); // Adds new item to the end of the array
                callback(serverNote);
            }
        }
        xhttp.open('POST', "/friends/" + encodeURIComponent(userID) + "/notes", true);
        xhttp.setRequestHeader("Content-Type", 'application/json;charset=UTF-8'); // Tell browser how our request is set up
        xhttp.send(JSON.stringify(note)); // stringify sets it up for a URL
    }
    function putNote(userID, note, callback) {
        var xhttp = new XMLHttpRequest(); // First Step
        xhttp.onreadystatechange = function () { // last step but we build is second
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                var serverNote = JSON.parse(xhttp.responseText || {}); // response
                callback(serverNote);
            }
        }
        xhttp.open('PUT', "/friends/" + encodeURIComponent(userID) + "/notes/" + encodeURIComponent(note._id), true);
        xhttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        xhttp.send(JSON.stringify(note));
    }
    
    function deleteNote(userID, note, callback) {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                cache[userID] = cache[userID].filter(function (localNote) {
                    return localNote._id != note._id; // Make sure that the note that is being deleted, does NOT match an id in the cache
                }); // Basically going to forEach through the array
                callback();
            }
        }
        xhttp.open('DELETE', "/friends/" + encodeURIComponent(userID) + "/notes/" + encodeURIComponent(note._id), true);
        xhttp.send(); // No need to send content
    }
    
    document.addEventListener("DOMContentLoaded", startUp, false); // DOMContentLoaded is faster than the load event. Doesnt wait for stylesheets
})(); // Parentheses allow function to be called automatically. Object EVALUATES to a function