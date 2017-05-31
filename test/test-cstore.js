var db,
    testData = [
        "../../ivastack/apps/codes-vis/data",
        "dfly-2550-min-amg",
        "dfly-terminals.csv"
    ].join("/");

var cstore = require("../src/cquery/cstore.js"),
    nodeDsv = require("../src/io/node-dsv.js");

function initCStore(metadata) {
    db = cstore({
        size: metadata,
        struct: [
            {name: "rank", type: "int"},
            {name: "chunks_finished", type: "int"},
            {name: "data_size", type: "int"},
            {name: "hops_finished", type: "float"},
            {name: "time_spend", type: "float"},
            {name: "busy_time", type: "float"},
            {name: "timestamp", type: "int"}
        ],
    });
}

nodeDsv.read({
    filepath  : testData,
    delimiter : ",",
    // bufferSize: 32*1024,
    onopen    : initCStore,
    onload    : function(n) { db.addRows(n) },
    oncomplete: function(d) {

        // console.log(db.data()[0].length);
        // var start = new Date();
        // db.filter({ rank: 10, timestamp:1650000});
        // console.log( new Date() - start);

        console.log(db.info());
    }

});
