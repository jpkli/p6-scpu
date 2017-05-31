var fs = require("fs"),
    nodeDsv = require("../../src/io/node-dsv.js"),
    dataStruct = require('../../src/core/datastruct'),
    pipeline = require('../../src/core/pipeline');

// var a = nodeDsv.read({
//     filepath  : "../data/dragonfly-router-traffic",
//     delimiter : " ",
// });
//
// var b = nodeDsv.read({
//     filepath  : "../data/amg27.csv",
//     delimiter : " ",
// });
//
// Promise.all([a, b]).then(function(text){
//     console.log(Object.keys(text[0]));
// }, function(error){
//     console.log(error);
// })

nodeDsv.readAll([
    { filepath : "../data/dragonfly-router-traffic", delimiter : " " },
    { filepath : "../data/dragonfly-router-stats", delimiter : " "  },
]).then(function(results){
    console.log(results);
});
