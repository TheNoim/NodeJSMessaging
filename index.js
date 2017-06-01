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









var SSH = require('simple-ssh');

function echo(callback) {
	var ssh = new SSH({
		host: 'host',//Find your devices ip address, settings>wifi>tap connected network> IP Address
		user: 'root',
		pass: 'alpine'//Default is alpine, You SHOULD change it
	});

	var data = '';
	var error = null;

	ssh.exec("sqlite3 -header ../mobile/Library/SMS/sms.db <<EOF\n"+
			 ".mode insert\n"+/*
			 ".separator '‰‰'\n"+*/
			 "Select message.ROWID, message.handle_id, text, chat_identifier from message, chat, chat_handle_join, chat_message_join where chat.ROWID = chat_handle_join.chat_id AND chat_handle_join.handle_id = message.handle_id AND chat.ROWID = chat_message_join.chat_id AND message_id = message.ROWID GROUP BY chat_identifier ORDER BY date DESC LIMIT 5;\n"+
			 "EOF\n", {
		out: function(stdout) {
			data += stdout;
		},
		exit: function(code) {
			if (code != 0) return callback(new Error('exit code: ' + code));

			// here's all the data you have persisted from stdout
			return callback(error, data);
		},
		error: function(err) {
			error = err;
		}
	}).start();
}


function sendSide()
{
	echo(function(err, data) {
		if (err) {
			// handle potential err
			console.error(err.stack);
		} else {
			console.log("before: ");
			console.log(data);
			var output = [];
			data = data.replace(/INSERT INTO table VALUES/g, "‰‰");
			var tempSplit = data.split(/‰‰/);
			tempSplit.shift(1);
			for(var i = 0; i < tempSplit.length; i += 4)
			{
				output.push({"ROWID":tempSplit[i],"handle_id":tempSplit[i+1],"text":tempSplit[i+2],"chat_identifier":tempSplit[i+3]});
			}
			console.log("after: ")
			console.log(data);
			console.log(output);
			persistantSocket.send({content:"side",messages:output});
		}
	});
}



















/*

"sqlite3 -header sms.db <<EOF
	.mode csv
		.separator '‰‰'
Select message.ROWID, message.handle_id, text, chat_identifier from message, chat, chat_handle_join, chat_message_join where chat.ROWID = chat_handle_join.chat_id AND chat_handle_join.handle_id = message.handle_id AND chat.ROWID = chat_message_join.chat_id AND message_id = message.ROWID GROUP BY chat_identifier ORDER BY date DESC;
EOF
"
*/


//get into sqlite3 terminal
/*function getSide(socket)
{
	console.log("calling get side");

	ssh.exec("sqlite3 -header ../mobile/Library/SMS/sms.db <<EOF\n"+
			 ".mode list\n"+
			 ".separator '‰‰'\n"+
			 "Select message.ROWID, message.handle_id, text, chat_identifier from message, chat, chat_handle_join, chat_message_join where chat.ROWID = chat_handle_join.chat_id AND chat_handle_join.handle_id = message.handle_id AND chat.ROWID = chat_message_join.chat_id AND message_id = message.ROWID GROUP BY chat_identifier ORDER BY date DESC;\n"+
			 "EOF\n", {
		out: function(stdout) {
			console.log("we are going to send stuff");
			var output = [];
			stdout = stdout.replace(/\n/g, "‰‰");
			var tempSplit = stdout.split(/‰‰/);
			for(var i = 0; i < tempSplit.length; i += 4)
			{
				output.push({"ROWID":tempSplit[i],"handle_id":tempSplit[i+1],"text":tempSplit[i+2],"chat_identifier":tempSplit[i+3]});
			}
			console.log(stdout);
			socket.send({content:"side",messages:output});
			//console.log(stdout.split(/\r?\n/));
		},
		err: function(stderr) {
			console.log(stderr); // this-does-not-exist: command not found
		}
	}).start();
}*/


/*
‰ <-column separator
½ <-row separator

*/


/*ssh
	.exec('cd ../mobile/Library/SMS\n ls', {
	out: function(stdout) {
		console.log(stdout);
	}
}).start();*/
/*ssh.exec('ls', {
	out: function(stdout) {
		console.log(stdout);
	}
}).start();*/




app.use(express.static(__dirname + '/html'));

app.get('/', function(req, res){
	res.sendfile('./html/page.html');
});
//Whenever someone connects this gets executed
io.on('connection', function(socket){
	//start(socket);
	persistantSocket = socket;
	sendSide();
	//Whenever someone disconnects this piece of code executed
	socket.on('clientEvent', function(data){
		//	getMessages(socket,data);
	});

});

server.listen(3000, function(){
	console.log('nodeJS Messages is now online');
});











/*
















function downloadMessages()
{
	sftp.connect({
		host: '192.168.1.112',
		port: '22',
		username: 'root',
		password: 'alpine'
	}).then(() => {
		return ;
	}).then((data) => {
		const remoteFilename = '../mobile/Library/SMS/sms.db';
		const localFilename = './messages/messages.db';
		sftp.get(remoteFilename,null,null).then((stream) => {
			stream.on('end', function () {
				db = new sqlite3.Database('./messages/messages.db');
				start();
				sftp.end();
			});
			stream.pipe(fs.createWriteStream(localFilename));
		});
		return;
	}).catch((err) => {
		console.log(err, 'catch error');
	});
}

if(0)
{
	downloadMessages();
}else
{
	db = new sqlite3.Database('./messages/messages.db');
}
function getMessages(socket,handleID)
{
	var output = [];

	db.all("Select text,is_from_me from message, chat, chat_handle_join, chat_message_join where chat.ROWID = chat_handle_join.chat_id AND chat_handle_join.handle_id = message.handle_id AND chat.ROWID = chat_message_join.chat_id AND message_id = message.ROWID AND message.handle_id = "+handleID+" ORDER BY date ASC",function(err,rows){
		for(let i =0;i < rows.length;i++)
		{
			output.push(rows[i])
		}
		socket.send({content:"main",messages:output});
	})
}
function start(socket)
{
	//Get all chats with different people
	var output = [];

	db.all("Select message.ROWID, message.handle_id, text, chat_identifier from message, chat, chat_handle_join, chat_message_join where chat.ROWID = chat_handle_join.chat_id AND chat_handle_join.handle_id = message.handle_id AND chat.ROWID = chat_message_join.chat_id AND message_id = message.ROWID GROUP BY chat_identifier ORDER BY date DESC;",function(err,rows){
		for(let i =0;i < rows.length;i++)
		{
			output.push(rows[i])
		}
		socket.send({content:"side",messages:output});
	})
}*/
