/*
Author: Gabriel Ortega
Date: 2.11.19

Filename: index.js // Database functionality for API
*/

var MongoClient = require('mongodb').MongoClient; // Official driver that NodeJS can use to connect to it
var ObjectID = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017'; 
var DBName = 'twitter_notes';
var database;

module.exports = {
    connect: function () {
        MongoClient.connect(url, function (err, client) { // Return a unique object for connection
            if (err) {
                return console.log("Error: ", err);
            } 
            database = client.db(DBName);
            console.log("Connected to Database: " + DBName);
        }); // static method of the mongo client class, params based on documentation
    },
    connected: function () {
        return typeof database != 'undefined'; // If undefined, not connected. 
    }, 
    insertFriends: function (friends) {
        database.collection('friends').insertMany(friends, function (err) {
            if (err) {
                console.log("Cannot insert friends into database.");
            } 
        }); 
    },
    getFriends: function (userId, callback) {
        var cursor = database.collection('friends').find({
            // Feed JSON to return JSON
            for_user: userId
        }); // Give us back a cursor str
        cursor.toArray(callback);
    },
    deleteFriends: function () {
        database.collection('friends').deleteMany( ({}), function (err) {
            if (err) {
                console.log("Cannot remove friends from database");
            }
        } ); // "signal" to match everything
    }, 
    getNotes: function (ownerID, friendID, callback) { // Owner = Our twitter ID
        var cursor = database.collection('notes').find( {
            owner_id: ownerID,
            friend_id: friendID
        } ); // NonSQL "SELECT" from SQL
        cursor.toArray(function (error, notes) {
            if (error) {
                return callback(error);
            }
            callback(null, notes.map(function (note) { // map = transform array into new one
                return {
                    _id: note._id,
                    content: note.content
                }
            })); // Null for no error
        });
    },
    insertNote: function (ownerID, friendID, content, callback) {
        database.collection('notes').insertOne({
            owner_id: ownerID,
            friend_id: friendID,
            content: content
        }, function (err, result) { // callback function
            if (err) {
                return callback(err, result);
            }
            callback(null, { // send back unique id that Mongo has given us
                _id: result.ops[0]._id,
                content: result.ops[0].content
            });
        });
    },
    updateNote: function (noteID, ownerID, content, callback) {
        database.collection('notes').updateOne({
            _id: new ObjectID(noteID), // Creates new MongoDB ID in order to identify note to be updated
            owner_id: ownerID,
        }, {
            $set: {
                content: content
            }
        },
            function (err) {
                if (err) {
                    return callback(err);
                }
                database.collection('notes').findOne({
                    _id: new ObjectID(noteID)
                },
                callback);
        }); // First JSON. Target. Second JSON, process
    },
    deleteNote: function (noteID, ownerID, callback) {
        database.collection('notes').deleteOne({
            _id: new ObjectID(noteID),
            owner_id: ownerID
        }, callback);
    }
};





