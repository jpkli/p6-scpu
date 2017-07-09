var root = typeof self == 'object' && self.self === self && self ||
           typeof global == 'object' && global.global === global && global ||
           this;

// root.define = require('amdefine/intercept');
root.p4 = {
    arrays      : require("../core/arrays"),
    pipeline    : require("../core/pipeline"),
    datastruct  : require('../core/datastruct'),
    alloc       : require('../core/alloc'),

    cstore      : require("../cquery/cstore"),

    dataopt: {
        aggregate: require('../dataopt/aggregate'),
        stats   : require("../dataopt/stats"),
        select  : require("../dataopt/select")
    },

    io: {
        ajax        : require("../io/ajax"),
        csv         : require("../io/node-dsv"),
        printformat : require("../io/printformat"),
        parser      : require("../io/parser")
    },

    rand      : require('../util/rand')
};

if(typeof module != 'undefined')
    module.exports = root.p4;
