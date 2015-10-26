var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http, { serveClient: true });
var Clients = [];

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
	console.log(socket.id + ' has connected');
	Clients.push(socket.id);
	socket.on('chat message', function(msg){
		io.emit('chat message', msg);
	});

	socket.on('disconnect', function() {
		console.log(this.id + ' has disconneted');
		var index = Clients.indexOf(this.id);
		if (index) {
			Clients.splice(index, 1);
		}
		io.emit('clients', Clients);
	});

	io.emit('clients', Clients);
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});