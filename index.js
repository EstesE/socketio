var app = require('express')();
var http = require('http').Server(app);
var config = require('./config');
var io = require('socket.io')(http, { serveClient: true });
var Clients = [];
var c = require('./codes');

// app.use(function(req, res, next) {
// 	res.header("Access-Control-Allow-Origin", "*");
// 	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
// 	next();
// });

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
		// Authentication piece???
		// console.log('user: ', JSON.parse(socket.handshake.query.user));
	}
	return next();
});

// // Start multiple namespaces
// for(var i = 0;  i < c.codes.length; i++) {
// 	io.of(c.codes[i].code).on('connection', connection(io.of('/' + c.codes[i].code)));
// }

// Vanilla...
io.on('connection', connection());

// Start single namespace
// io.of(2222).on('connection', connection(io.of('/2222')));


function connection(ns) {
	return function(socket) {
		if(socket.handshake.query.user) {
			// console.log(JSON.parse(socket.handshake.query.user).userName.toLowerCase() + '(' + socket.id + ') has connected to ' + ns.name + ' from ' + socket.handshake.address);	
			Clients.push({'id': socket.id, 'name': JSON.parse(socket.handshake.query.user).userName.toLowerCase()});
			// Clients.push(JSON.parse(socket.handshake.query.user).userName);
		} else {
			// console.log(socket.id + ' has connected to ' + ns.name + ' from ' + socket.handshake.address);
			Clients.push({'id': socket.id, 'name': ''});
		}
		console.log('');
		console.log('============ Connected Clients ============');
		console.log('  ' + new Date());
		console.log(Clients);
		console.log('');

		// Add connected clients to our Clients array
		// Clients.push(socket.id);
		
		// Broadcast to all users in namespace that someone connected
		// socket.broadcast.emit('info', socket.id + ' has connected to ' + ns.name + ' from ' + socket.handshake.address);
		socket.broadcast.emit('info', socket.id + ' has connected');

		// Handle Disconnects
		socket.on('disconnect', disconnectCallback(socket, ns));

		// // Send a notification message to specific users (this should change the notifications of the conversation)
		// socket.on('notification', function(from, msg) {
		// 	console.log('notification');
		// 	// from.participants.map(function(user) {
		// 	// 	console.log(user);

		// 	// });
		// 	socket.broadcast.emit('notification', msg);
		// });

		socket.on('notification', function(data) {
			// This will broadcast the 'notification' to all sockets. This can be handled on the client but then things would become much to chatty.
			// io.sockets.emit("notification",socket.id, data);

			// This will send to the correct client as long as their socket.id is in the 'to' field of the payload.
			for (var i = 0; i < io.sockets.sockets.length; i++) {
				if (io.sockets.sockets[i].id === JSON.parse(data).to) {
					io.sockets.sockets[i].emit('notification', JSON.parse(data).to, data);
				}
			}
		});

		socket.on('chat message', messageCallback(socket, ns));
		socket.on('from_property', fromPropertyCallback(socket, ns));
	}
}


function disconnectCallback(socket, ns) {
	return function(msg) {
		var self = this;
		for(var i = 0; i < Clients.length; i++) {
			if(Clients[i].id === self.id) {
				Clients.splice(i, 1);
			}
		}

		console.log('');
		console.log('============ Connected Clients ============');
		console.log('  ' + new Date());
		console.log(Clients);
		console.log('');
	}
}

function messageCallback(socket, ns) {
	return function(msg) {
		console.log('MSG: ', msg);
		// console.log(ns.name);
		// Save to MongoDB with timestamp/message/address of sender
		// Send to Plivo

		// Send to Plivo via messaging-web-api and tell the property to get new messages depending on the 'status' (https://www.plivo.com/docs/api/message/)
		// this.broadcast.emit('msg_sent', true);

		//Update others in this namespace
		// this.broadcast.emit('chat message', msg);


		// Send to the sending client		
		this.emit('chat message', msg);
		// Send to others
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
