var root = typeof self == 'object' && self.self === self && self ||
           typeof global == 'object' && global.global === global && global ||
           this;
           
root.define = require('amdefine/intercept');
root.p4 = {
    arrays          : require("../core/arrays"),
    pipeline        : require("../core/pipeline"),
    datastruct      : require('../core/datastruct'),


    cstore      : require("../cquery/cstore"),

    dataopt: {
        stats: require("../dataopt/stats"),
    },

    io: {
        ajax        : require("../io/ajax"),
        csv         : require("../io/node-dsv"),
        printformat : require("../io/printformat"),
        parser      : require("../io/parser")
    },
};

if(typeof module != 'undefined')
    module.exports = root.p4;
