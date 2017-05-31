if (typeof(define) !== 'function') var define = require('amdefine')(module);

define(function(require){
    "use strict";
    var opt = require("../core/arrays.js");

    function stats(data, fields){

        if(!Array.isArray(data))
            throw new Error("Inproper input data format.");

        var result = {};

        fields.forEach(function(f) {
            var a = data.map(function(d){return d[f]; });
            result[f] = {
                min: opt.min(a),
                max: opt.max(a),
                avg: opt.avg(a),
                std: opt.std(a)
            };
        });

        return result;
    };


    stats.domains = function(data, fields) {
        if(!Array.isArray(data))
            throw new Error("Inproper input data format.");

        var result = {};

        fields.forEach(function(f) {
            var a = data.map(function(d){return d[f]; });
            result[f] = [ opt.min(a), opt.max(a) ];
        });

        return result;
    }

    return stats;
});
