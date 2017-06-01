define(function Derive(require) {
    "use strict";

    var $ = require('../core/arrays.js');

    return function(data, spec){
        if(!Array.isArray(data))
            throw new Error("Inproper input data format.");

        if(typeof(spec) === "function") {
            data.forEach(spec);
        } else {
            var result = [],
                tranfs = {};

            Object.keys(spec).forEach(function(s){
                if(typeof(spec[s]) == "function") {
                    tranfs[s] = function(d) { d[s] = spec[s](d) };
                } else {
                    tranfs[s] = Function("attr", "attr." + s + "=" + spec[s].replace(/@/g, 'attr.').replace(/\$/g, '$.') + ";");
                }
            });

            data.forEach(function(d){
                Object.keys(spec).forEach(function(s){
                    tranfs[s](d);
                });
            });
        }

        return data;
    }
});
