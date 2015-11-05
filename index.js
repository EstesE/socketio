var app = require('express')();
var http = require('http').Server(app);
var config = require('./config');
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
	io.of(c.codes[i].code).on('connection', connection(io.of('/')));
}


function connection(ns) {
	return function(socket) {
		if(socket.handshake.query.user) {
			console.log(JSON.parse(socket.handshake.query.user).userName.toLowerCase() + '(' + socket.id + ') has connected to ' + ns.name + ' from ' + socket.handshake.address);	
		} else {
			console.log(socket.id + ' has connected to ' + ns.name + ' from ' + socket.handshake.address);
		}
		
		socket.broadcast.emit('info', socket.id + ' has connected to ' + ns.name + ' from ' + socket.handshake.address);
		socket.on('disconnect', disconnectCallback(socket, ns));
		socket.on('chat message', messageCallback(socket, ns));
		socket.on('from_property', fromPropertyCallback(socket, ns));
		setInterval(function() {
		    socket.emit('heartbeat', 'someData');
		}, 10000);
	}
}

function disconnectCallback(socket, ns) {
	return function(msg) {
		this.broadcast.emit('info', this.id + ' has disconnected from ' + ns.name);
	}
}

function messageCallback(socket, ns) {
	return function(msg) {
		console.log('MSG: ', msg);
		console.log(ns.name);
		// Save to MongoDB with timestamp/message/address of sender
		// Send to Plivo

		// Send to Plivo via messaging-web-api and tell the property to get new messages depending on the 'status' (https://www.plivo.com/docs/api/message/)
		// this.broadcast.emit('msg_sent', true);

		//Update others in this namespace
		this.broadcast.emit('chat message', msg);
	}
}

function fromPropertyCallback(socket, ns) {
	return function(msg) {
		console.log('fromPropertyCallback: ', msg);
	}
}


http.listen(config.socketio.port, function(){
	console.log('listening on *:3000');
});
