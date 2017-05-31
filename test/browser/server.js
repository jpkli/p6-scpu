var fs = require('fs'),
    path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    server = require('http').Server(app);

var port = process.env.PORT || 8100,
    host = process.env.HOST || "localhost";

console.log("initializing server ");

// Static files
app.use(express.static('.'));
app.use(express.static('..'));
app.use("/p4", express.static('../../src'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

server.listen(port, host, function(){
    console.log("server started, listening", host, port);
});
