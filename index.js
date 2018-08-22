'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var https = require('https');
// var http = require('http');
var socketIO = require('socket.io');
var fs = require("fs");
var options = {
    key: fs.readFileSync('./server.key'),
    cert: fs.readFileSync('./server.crt')
};

console.log('here is head')

var fileServer = new(nodeStatic.Server)();

var app = https.createServer(options,function(req, res) {
  fileServer.serve(req, res);
}).listen(8080);
// var app = http.createServer(function(req, res) {
//     fileServer.serve(req, res);
// }).listen(8080);

var io = socketIO.listen(app);
io.sockets.on('connection', function(socket) {

  // convenience function to log server messages on the client
  function log() {
    console.log('here is function log')
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

  socket.on('message', function(message) {
    console.log('here is socket.on message')
    log('Client said: ', message);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.emit('message', message);  
});

  socket.on('create or join', function(room) {
    console.log('here is socket.on create or join')
    log('Received request to create or join room ' + room);

    var numClients = io.sockets.sockets.length;
    log('Room ' + room + ' now has ' + numClients + ' client(s)');

    if (numClients === 1) {
      console.log('create or join >> numClient is 1')
      log('Client ID ' + socket.id + ' created room ' + room);
      socket.join(room);

      console.log('Client ID ' + socket.id + ' created room ' + room);
      socket.emit('created', room, socket.id);

    } else if (numClients === 2) {
      console.log('create or join >> numClient is 2')
      log('Client ID ' + socket.id + ' joined room ' + room);
      io.sockets.in(room).emit('join', room);
      console.log('sockets in room emit join in create or join socket')
      socket.join(room);
      console.log('sockets join in create or join socket')
      socket.emit('joined', room, socket.id);
      console.log('sockets emit joined in create or join socket')
      io.sockets.in(room).emit('ready');
      console.log('sockets in room emit ready in create or join socket')
    } else { // max 5 clients
      console.log('create or join >> numClient is more 2')
      socket.emit('full', room);
    }
  });

  socket.on('ipaddr', function() {
    console.log('here is socket.on ipaddr')
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit('ipaddr', details.address);
        }
      });
    }
  });

  socket.on('bye', function(){
    console.log('received bye');
     
});

});
