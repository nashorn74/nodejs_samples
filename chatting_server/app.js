
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , redis = require('redis')
  , socketio = require('socket.io')
  , mongoose = require('mongoose');

var app = express();

mongoose.connect('mongodb://127.0.0.1/test');
var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;
var chatLogSchema = new Schema({
	id: ObjectId,
	log: String,
	date: String
});
var ChatLogModel = mongoose.model('chatLog', chatLogSchema);
var server = null;
var io = null;
var users = [];
var subscriber = redis.createClient();
var publisher = redis.createClient();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

server = http.createServer(app);

io = socketio.listen(server);
io.sockets.on('connection', function(socket) {
	
	console.log('connection');
	
	socket.on('chat_user', function(raw_msg) {
		console.log('chat_user');
		var msg = JSON.parse(raw_msg);
		var channel = '';
		if(msg["channel"] != undefined) {
			channel = msg["channel"];
		}
		socket.emit('socket_evt_chat_user', JSON.stringify(users));
		var chatLog = mongoose.model('chatLog', chatLogSchema);
		chatLog.find({}, function (err, logs) {
			socket.emit('socket_evt_logs', JSON.stringify(logs));
			socket.broadcast.emit('socket_evt_logs', JSON.stringify(logs));
		});
	});
	socket.on('chat_conn', function(raw_msg) {
		console.log('chat_conn');
		var msg = JSON.parse(raw_msg);
		var channel = '';
		if(msg['channel'] != undefined) {
			channel = msg['channel'];
		}
		socket.set('workspace', msg.workspace);
		var index = users.indexOf(msg.chat_id);
		if (index != -1) {
			socket.emit('chat_fail', JSON.stringify(msg.chat_id));
		} else {
			users.push(msg.chat_id);
			socket.broadcast.emit('chat_join', JSON.stringify(users));
			socket.emit('chat_join', JSON.stringify(users));
			var chatLog = new ChatLogModel();
			chatLog.log = msg.chat_id + ' 접속했습니다.';
			chatLog.date = getToday();
			chatLog.save(function (err) {
				if (err)
					return handleError(err);
				var chatLog_ = mongoose.model('chatLog', chatLogSchema);
				chatLog_.find({}, function (err, logs) {
					socket.emit("socket_evt_logs", JSON.stringify(logs));
					socket.broadcast.emit("socket_evt_logs", JSON.stringify(logs));
				});
			});
		}
	});
	socket.on('message', function(raw_msg) {
		console.log('message');
		var msg = JSON.parse(raw_msg);
		var channel = '';
		if(msg['channel'] != undefined) {
			channel = msg['channel'];
		}
		if (channel == 'chat') {
			var chatting_message = msg.chat_id + ' : ' + msg.message;
			publisher.publish('chat', chatting_message);
		}
	});
	socket.on('leave', function(raw_msg) {
		console.log('leave');
		var msg = JSON.parse(raw_msg);
		if (msg.chat_id != '' && msg.chat_id != undefined) {
			var index = users.indexOf(msg.chat_id);
			socket.emit('someone_leaved', JSON.stringify(msg.chat_id));
			socket.broadcast.emit('someone_leaved', JSON.stringify(msg.chat_id));
			users.splice(index, 1);
			var chatLog = new ChatLogModel();
			chatLog.log = msg.chat_id + ' 사용자가 나갔습니다.';
			chatLog.date = getToday();
			chatLog.save(function (err) {
				if (err)
					return handleError(err);
				var chatLog_ = mongoose.model('chatLog', chatLogSchema);
				chatLog_.find({}, function (err, logs) {
					socket.emit('socket_evt_logs', JSON.stringify(logs));
					socket.broadcast.emit('socket_evt_logs', JSON.stringify(logs));
				});
			});
		}
		socket.emit('refresh_userlist', JSON.stringify(users));
		socket.broadcast.emit('refresh_userlist', JSON.stringify(users));
	});
	subscriber.on('message', function(channel, message) {
		console.log('subscriber message');
		socket.emit('message_go', message);
	});
	subscriber.subscribe('chat');
});
io.sockets.on('close', function(socket) {
	subscriber.unsubscribe();
	publisher.close();
	subscriber.close();
});

server.listen(app.get('port'), function(){
	 console.log('Express server listening on port ' + app.get('port'));
});

function getToday() {
	var date = new Date();
	return date.getFullYear()+'.'+(date.getMonth()+1)+'.'+
		date.getDate()+' '+date.getHours()+':'+
		date.getMinutes()+':'+date.getSeconds();
}