var fs = require("fs"),
    ctypes = require("../../src/ctypes/ctypes.js"),
    cstore = require("../../src/ctypes/cstore.js"),
    nodeDsv = require("../../src/io/node-dsv.js"),
    dataStruct = require('../../src/core/datastruct'),
    pipeline = require('../../src/core/pipeline'),
    db;

function initCStore(metadata) {
    db = cstore({
        size: metadata.rowTotal,
        struct: {
            rank            : "int",
            chunks_finished : "int",
            data_size       : "int",
            hops_finished   : "float",
            time_spend      : "float",
            busy_time       : "float",
            timestamp       : "int"
        },
        // types: [ctypes.int, ctypes.int, ctypes.int, ctypes.float, ctypes.float, ctypes.float, ctypes.int],
        // names: ["rank", "chunks_finished", "data_size", "hops_finished", "time_spent", "busy_time", "timestamp"],
    });
}

nodeDsv.read({
    filepath  : "../data/testdata.csv",
    delimiter : ",",
    // bufferSize: 32*1024,
    onopen    : initCStore,
    onload    : function(n) { db.addRows(n) },
}).then(function(){
    console.log(db.columns()['timestamp']);
});

// nodeDsv.read({
    // filepath  : "../data/testdata.csv",
    // delimiter : ",",
    // // bufferSize: 8*1024*1024,
    // oncomplete: function(data) {
    //     var rows = dataStruct({
    //         array: data,
    //         header: ["rank", "chunks_finished", "data_size", "hops_finished", "time_spent", "busy_time", "timestamp"],
    //         types: ["int", "int", "int", "float", "float", "float", "int"],
    //     }).objectArray();
    //
    //     var p1 = pipeline
    //         .derive({test: "@hops_finished / 10 "});
    //         // .match({rank: 1})
    //         // .group({$by: 'rank', data_size: "$sum"});
    //
    //     console.log(p1(rows));
    // }
// });


// nodeDsv.read({
//     filepath  : "../data/amg27.csv",
//     delimiter : ",",
//     // bufferSize: 8*1024*1024,
//     oncomplete: function(data) {
//         var rows = dataStruct({
//             array: data,
//             header: ["rank", "mpicall", "walltime_start", "cputime_start", "thread", "dest", "src", "walltime_end", "cputime_end"],
//             types: ["int", "string", "float", "float", "int", "int", "int", "float", "float"],
//             skip: 1,
//         }).objectArray();
//
//         // console.log(pipeline.histogram.toString());
//
//         var p1 = pipeline
//             .match({ mpicall: " MPI_Isend"})
//             .group({$by: ["dest", "rank"], mpicall: "$count"})
//             .group({$by: "rank", mpicall: "$sum"})
//             .histogram({mpicall: 5});
//
//         console.log(p1(rows));
//     }
// });
