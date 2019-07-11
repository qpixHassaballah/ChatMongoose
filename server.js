const mongo = require('mongodb').Mongosocket;
// const socket = require('socket.io').listen(4000).sockets;
const io = require('socket.io-client');
var mongoose = require('mongoose');
var path = require('path');

var socket = io('http://localhost:3000', {transports: ['websocket']})
mongoose.connect('mongodb://pete:qpix2882@ds119802.mlab.com:19802/chatter');
// Connect to mongo
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
// Connect to mongo

db.once('open', function() {
    // if(err){
    //     throw err;
    // }

    console.log('MongoDB connected ...');

    // Connect to Socket.io
    socket.on('connection', function(socket){
        let chat = db.collection('chats');

        // Create function to send status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        // Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }

            // Emit the messages
            socket.emit('output', res);
        });

        // Handle input events
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;

            // Check for name and message
            if(name == '' || message == ''){
                // Send error status
                sendStatus('Please enter a name and message');
            } else {
                // Insert message
                chat.insert({name: name, message: message}, function(){
                    socket.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });

        // Handle clear
        socket.on('clear', function(data){
            // Remove all chats from collection
            chat.remove({}, function(){
                // Emit cleared
                socket.emit('cleared');
            });
        });
    });
});