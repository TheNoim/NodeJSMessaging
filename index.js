/*
IOS DEPENDANCIES/SETUP
	- enable SSH over WiFi https://www.reddit.com/r/jailbreak/comments/5s19qg/tutorial_ssh_over_wifi_with_yalu102_jb/
	- install SQLite 3.x from Cydia/Telesphoreo repo
	- install CLSMS from https:// s1ris.github.io/repo
*/
var fs = require('fs');

var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);

var io = require('socket.io').listen(server);
var persistantSocket;


var configFile = (fs.readFileSync('./config.json', 'utf8'));
configFile = JSON.parse(configFile);

app.use(express.static(__dirname + '/html'));

app.get('/', function(req, res){
	res.sendfile('./html/page.html');
});

io.on('connection', function(socket){
	persistantSocket = socket;
	sendSide();

	socket.on('requestMessages', function(data){
		sendMessagesToClient(data);
	});
	socket.on('sendMessage', function(data){
		var ssh = new SSH({
		host: configFile.deviceIP,//Find your devices ip address, settings>wifi>tap connected network> IP Address
		user: configFile.user,
		pass: configFile.pass//Default is alpine, You SHOULD change it
	});
		ssh.exec('clsms "'+data.content+'" '+data.recipient).start();
		//console.log(data);
	});
	console.log("connected");

});

server.listen(3000, function(){
	console.log('nodeJS Messages is now online');
});

var SSH = require('simple-ssh');

function getSide(callback) {
	var ssh = new SSH({
		host: configFile.deviceIP,//Find your devices ip address, settings>wifi>tap connected network> IP Address
		user: configFile.user,
		pass: configFile.pass//Default is alpine, You SHOULD change it
	});

	var data = '';
	var error = null;

	ssh.exec("sqlite3 -header ../mobile/Library/SMS/sms.db <<EOF\n"+
			 ".mode insert\n"+/*
			 ".separator '‰‰'\n"+*/
			 "Select message.ROWID, message.handle_id, chat_identifier,text from message, chat, chat_handle_join, chat_message_join where chat.ROWID = chat_handle_join.chat_id AND chat_handle_join.handle_id = message.handle_id AND chat.ROWID = chat_message_join.chat_id AND message_id = message.ROWID GROUP BY chat_identifier ORDER BY date DESC;\n"+
			 "EOF\n", {
		out: function(stdout) {
			data += stdout;
		},
		exit: function(code) {
			if (code != 0) return callback(new Error('exit code: ' + code));
			return callback(error, data);
		},
		error: function(err) {
			error = err;
		}
	}).start();
}

function sendSide()
{
	getSide(function(err, data) {
		if (err) {
			console.error(err.stack);
		} else {
			var output = [];
			//console.log(data);
			data = data.replace(/INSERT INTO table VALUES/g, "‰‰");
			var currentIndex = 0;
			var cutLocation;
			while(data.length>1)
			{
				let message = {"ROWID":null,"handle_id":null,"chat_identifier":null,"text":null}
				cutLocation = data.indexOf(",");
				message.ROWID = data.substring(3, cutLocation);
				data = data.substr(cutLocation+1)

				cutLocation = data.indexOf(",");
				message.handle_id = data.substring(0, cutLocation);
				data = data.substr(cutLocation+1)

				cutLocation = data.indexOf(",");
				var chatFormat = data.indexOf("'");
				if( chatFormat < cutLocation)
				{
					message.chat_identifier = data.substring(1, cutLocation-1);
				}else
				{
					message.chat_identifier = data.substring(0, cutLocation);
				}
				data = data.substr(cutLocation+2)

				cutLocation = data.indexOf("');\n");
				message.text = data.substring(0, cutLocation);
				output.push(message);
				data = data.substr(cutLocation+4)
			}
			persistantSocket.send({content:"side",messages:output});
		}
	});
}

function getMessages(chat_identifier,callback) {
	var ssh = new SSH({
		host: configFile.deviceIP,//Find your devices ip address, settings>wifi>tap connected network> IP Address
		user: configFile.user,
		pass: configFile.pass//Default is alpine, You SHOULD change it
	});

	var data = '';
	var error = null;
	ssh.exec("sqlite3 -header ../mobile/Library/SMS/sms.db <<EOF\n"+
			 ".mode insert\n"+/*
			 ".separator '‰‰'\n"+*/
			 "Select is_from_me,service,text from message, chat, chat_handle_join, chat_message_join where chat.ROWID = chat_handle_join.chat_id AND chat_handle_join.handle_id = message.handle_id AND chat.ROWID = chat_message_join.chat_id AND message_id = message.ROWID AND chat_identifier = '"+chat_identifier+"' ORDER BY date ASC;\n"+
			 "EOF\n", {
		out: function(stdout) {
			data += stdout;
		},
		exit: function(code) {
			if (code != 0) return callback(new Error('exit code: ' + code));
			return callback(error, data);
		},
		error: function(err) {
			error = err;
		}
	}).start();
}

function sendMessagesToClient(chat_identifier)
{
	getMessages(chat_identifier,function(err, data) {
		if (err) {
			console.error(err.stack);
		} else {
			var output = [];
			data = data.replace(/INSERT INTO table VALUES/g, "‰‰");
			var currentIndex = 0;
			var cutLocation;
			//console.log(data);
			while(data.length>1)
			{
				let message = {"is_from_me":null,"service":null,"text":null}
				cutLocation = data.indexOf(",");
				message.is_from_me = parseInt(data.substring(3, cutLocation));
				data = data.substr(cutLocation+1)
				cutLocation = data.indexOf(",");
				message.service = data.substring(1, cutLocation-1);
				data = data.substr(cutLocation+2)

				cutLocation = data.indexOf("');\n");
				message.text = data.substring(0, cutLocation);
				output.push(message);
				data = data.substr(cutLocation+4)
			}
			persistantSocket.send({content:"main",messages:output});
		}
	});
}

//TODO
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(bodyParser.json());

app.post("/", function (req, res) {
	//ON DEVICE when message is recieved post, and reload messages for desktop client
	console.log("time to reload messages");
});


