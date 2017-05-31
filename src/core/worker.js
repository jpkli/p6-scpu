if(typeof self === 'undefined' || typeof module.exports === 'undefined'){
    // Node.js
    var opt = require('../dataopt/query.js'),
        self = process;

    self.addEventListener = self.once;
    self.postMessage = process.send;

} else {
    // Browser
    self.importScripts('./arrays.js');
}

var workerID;

self.addEventListener('message', function(msg){
    // console.log("worker", msg.command);
    var task,
        command = msg.command,
        arg = msg.arg,
        data = msg.data;

    if(command == 'udf') { //user defined functions
        task = new Function("return " + msg.fns)();
    } else {
        console.log("worker", command, data[0]);
        if(command in opt) task = opt[command];
    }
    workerID = msg.id
    var start = new Date();
    var res = task(data, arg);

    process.send({data:res, workerID: workerID});
    console.log("worker",workerID, data.length, res.length, new Date().getTime(), new Date() - start);

}, false);
