var fs = require("fs"),
    ctypes = require("../../src/ctypes/ctypes.js"),
    cstore = require("../../src/ctypes/cstore.js"),
    nodeDsv = require("../../src/io/promise/node-dsv.js"),
    dataStruct = require('../../src/core/datastruct'),
    pipeline = require('../../src/core/pipeline')();

function dragonflyLink(num_routers, num_groups, num_links) {
    var router_per_group = num_routers / num_groups,
        links = [];

    for(var i = 0; i<num_routers; i++){
        var router_id = i,
            group_id = Math.floor(router_id / router_per_group);

            router_id = i % router_per_group;
        var first = router_id % num_routers;
        var dest = [];
        for (var j=0; j < num_links; j++) {
            var target_grp = first;
            if(target_grp == group_id) {
                target_grp = num_groups - 1;
            }
            var my_pos = group_id % router_per_group;
            if(group_id == num_groups - 1) {
                my_pos = target_grp % router_per_group;
            }

            var target_pos =  target_grp * router_per_group + my_pos;
            first += router_per_group;
            dest.push(target_pos);
        }
        links[i] = dest;
    }

    return function(router_id) {
        return links[router_id];
    }
}

nodeDsv.readAll([
    { filepath : "../data/dragonfly-router-traffic", delimiter : " " },
    { filepath : "../data/dragonfly-router-stats", delimiter : " "  },
    { filepath : "../data/dragonfly-msg-stats", delimiter : " "  },
]).then(function(text){

    var traffic = dataStruct({
        array: text[0],
        header: ["lp_id", "group_id", "router_id", "local_traffic", "global_traffic"],
        types: ["int", "int", "int", "veci10", "veci5"],
        skip: 2,
    }).objectArray();

    var busytime = dataStruct({
        array: text[1],
        header: ["lp_id", "group_id", "router_id", "local_busytime", "global_busytime"],
        types: ["int", "int", "int", "vecf10", "vecf5"],
        skip: 2,
    }).objectArray();

    var data = dataStruct.join(traffic, busytime);
    // console.log(data);

    var terminals = dataStruct({
        array: text[2],
        header: ["lp_id", "terminal_id", "data_size", "avg_packet_latency", "packets_finished", "avg_hops", "busy_time"],
        types: ["int", "int", "int", "float", "float", "float", "float"],
        skip: 1
    }).objectArray();

    const NUM_ROUTER = 510,
        NUM_GROUP = 51,
        TERMINAL_PER_ROUTER = 5,
        ROUTER_PER_GROUP = 10,
        GLOBAL_LINK = 5,
        NUM_BIN = 7;

    var linkMap = dragonflyLink(NUM_ROUTER, NUM_GROUP, GLOBAL_LINK),
        aggrNodeMap = [];

    // pipeline.derive({router_id: "@group_id*10+@router_id"})(data);

    var dataProcess = pipeline.derive(function(d){
        d.router_id = d.group_id * ROUTER_PER_GROUP + d.router_id;
        d.targets = linkMap(d.router_id);
        d.total_busytime = d.global_traffic.reduce(function(a, b){return a+b;});
    })
    .binAggregate({total_busytime: NUM_BIN})
    .derive(function(d, i){
        d.src = d.data.map(function(a){return a.router_id;});
        d.dest = [];
        d.traffic = [];
        d.data.forEach(function(a){d.dest = d.dest.concat(a.targets);});
        d.data.forEach(function(a){d.traffic = d.traffic.concat(a.global_traffic);});
        d.src.forEach(function(s){
            aggrNodeMap[s] = i;
        })
        // console.log(d.traffic.length, d.dest.length);
    })
    .derive(function(d){
        d.links = [];
        for(var j = 0; j < NUM_BIN; j++){
            d.links[j] = 0;
            d.links[j] = { traffic: 0, count: 0 };
        }

        d.dest.forEach(function(dest, di){
            d.links[aggrNodeMap[dest]].traffic += d.traffic[di];
            d.links[aggrNodeMap[dest]].count++;
        });

        d.counts = d.links.map(function(a){return a.count});
        d.traffics = d.links.map(function(a){return a.traffic});

        delete d.dest;
        delete d.src;
        delete d.traffic;
        delete d.data;
    });

    var result = dataProcess(data);
    console.log(result);
    // console.log(aggrNodeMap);

    // var proc = pipeline.derive(function(d) {
    //     if(isNaN(d.avg_hops)) d.avg_hops = 0;
    //     d.router_id = Math.floor(d.terminal_id / TERMINAL_PER_ROUTER);
    // })
    // .sort({
    //     data_size: -1,
    //     router_id: 1
    // });
    //
    // try {
    //     var terminalData = proc(rows);
    //     console.log(terminalData);
    //     data.embed({$by: "router_id", terminals: terminalData});
    // } catch (e) {
    //     console.log(e);
    // }

    // console.log(data[0]);
    // var p1 = pipeline
    //     .derive({ totalTraffic: "$sum(@local_traffic) + $sum(@global_traffic)" })
})
.catch( function(err){console.log(err);} );
