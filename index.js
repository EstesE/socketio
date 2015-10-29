var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http, { serveClient: true });
var Clients = [];
var c = require('./codes');

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

/*
   Registers a middleware, which is a function that gets executed for
   every incoming Socket and receives as parameter the socket and a
   function to optionally defer execution to the next registered
   middleware.
*/
io.use(function(socket, next) {
	if(socket.handshake.query.user) {
		// console.log('user: ', JSON.parse(socket.handshake.query.user));
	}
	return next();
});


for(var i = 0;  i < c.codes.length; i++) {
	io.of(c.codes[i].code).on('connection', handleConnection(io.of(c.codes[i].code)));
}


function handleConnection(ns) {
	return function(socket) {
		socket.broadcast.emit('alert', socket.id + ' has connected to ' + ns.name);
		socket.on('disconnect', disconnectCallback(socket, ns));
		socket.on('chat message', messageCallback(socket, ns));
	}
}

function disconnectCallback(socket, ns) {
	return function(msg) {
		this.broadcast.emit('alert', this.id + ' has disconnected from ' + ns.name);
	}
}

function messageCallback(socket, ns) {
	return function(msg) {
		// Save to mongo
		// Send to Plivo
		//Update other in this namespace
		this.broadcast.emit('chat message', msg);
	}
}



http.listen(3000, function(){
	console.log('listening on *:3000');
});