var fs = require("fs"),
    nodeDsv = require("../../src/io/node-dsv.js"),
    dataStruct = require('../../src/core/datastruct'),
    pipeline = require('../../src/core/pipeline');

nodeDsv.read({
    filepath  : "../data/dragonfly-router-traffic",
    delimiter : " ",
    oncomplete: function(text) {

        var traffic = dataStruct({
            array: text,
            header: ["lp_id", "group_id", "router_id", "local_traffic", "global_traffic"],
            types: ["int", "int", "int", "veci10", "veci5"],
            skip: 2,
        }).objectArray();

        nodeDsv.read({
            filepath  : "../data/dragonfly-router-stats",
            delimiter : " ",
            oncomplete: function(text) {
                var busytime = dataStruct({
                    array: text,
                    header: ["lp_id", "group_id", "router_id", "local_busytime", "global_busytime"],
                    types: ["int", "int", "int", "vecf10", "vecf5"],
                    skip: 2,
                }).objectArray();

                // // console.log(pipeline.histogram.toString());

                var data = dataStruct.join(traffic, busytime);
                // console.log(data);
                var p1 = pipeline
                    .derive({ totalTraffic: "$sum(@local_traffic) + $sum(@global_traffic)" })
                    // .group({$by: ["dest", "rank"], mpicall: "$count"})
                    // .group({$by: "rank", mpicall: "$sum"})
                    .histogram({totalTraffic: 7});

                console.log(p1(data));
            }
        });


    }
});
