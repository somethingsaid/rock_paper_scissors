// Dependencies
// -----------------------------------------------------
var express = require('express');
var app  = express();
var socket_io = require('socket.io');
var http = require('http');
var server = http.Server(app);
var io = socket_io(server);

// Express Configuration
// -----------------------------------------------------

// Logging and Parsing
app.use(express.static(__dirname + '/public'));                 // sets the static files location to public
app.use('/node_modules',  express.static(__dirname + '/node_modules')); // Use Node Modules

// Listen
// -------------------------------------------------------
server.listen(8080);

// Socket.io
var usernames = {};
var choices = [];

// Fires when the user connects.
io.on('connection', function (socket) {
  var user_added = false;
  
  // Checks to see if there are already two players.
  // Otherwise, the connector will spectate.
  if (Object.keys(usernames).length == 2) {
     io.emit('room full');
     io.emit('user list', usernames);
  }
  
  // Fires once the connector types a username and hits ENTER.
  socket.on('add user', function (username) {  
     // Double checks to make sure a third user is not added.       
     if (Object.keys(usernames).length == 2) {
        io.emit('room full');
        io.emit('user list', usernames);
     } 
     else {
        socket.username = username;
        usernames[username] = username;
        user_added = true;      

        io.emit('user list', usernames);
        console.log('[socket.io] %s has connected.', socket.username);

        // Once there are two players, the game will start.
        if (Object.keys(usernames).length == 2) {
           io.emit('game start');
        }
     }
  });
  
  // Listens for choice submissions from the players.
  socket.on('player choice', function (username, choice) {
     choices.push({'user': username, 'choice': choice});
     console.log('[socket.io] %s chose %s.', username, choice);
     
     // Once both players have submitted a choice, the game checks for the winner.
     if (choices.length == 2) {
        console.log('[socket.io] Both players have made choices.');            
        if (choices[0]['choice'] === 'rock') {
           if  (choices[1]['choice'] === 'rock')      io.emit('tie', choices);
           if  (choices[1]['choice'] === 'paper')     io.emit('player 2 win', choices);
           if  (choices[1]['choice'] === 'scissors')  io.emit('player 1 win', choices);
           choices = [];
        } else if (choices[0]['choice'] === 'paper') {
           if  (choices[1]['choice'] === 'rock')      io.emit('player 1 win', choices);
           if  (choices[1]['choice'] === 'paper')     io.emit('tie', choices);
           if  (choices[1]['choice'] === 'scissors')  io.emit('player 2 win', choices);
           choices = [];
        } else if (choices[0]['choice'] === 'scissors') {
           if  (choices[1]['choice'] === 'rock')      io.emit('player 2 win', choices);
           if  (choices[1]['choice'] === 'paper')     io.emit('player 1 win', choices);
           if  (choices[1]['choice'] === 'scissors')  io.emit('tie', choices);
           choices = [];
        }
     }
  });
  
  // Fires when a user disconnects.
  socket.on('disconnect', function () {
     // Removes player from the list and resets the game.
     if (user_added) {
        delete usernames[socket.username];
        
        io.emit('user list', usernames);
        console.log('[socket.io] %s has disconnected.', socket.username);
        choices = [];
     }
  });
});

