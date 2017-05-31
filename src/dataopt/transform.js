if (typeof(define) !== 'function') var define = require('amdefine')(module);

define(function Query(require){
    return function Transform(data, spec){
        if(!Array.isArray(data))
            throw new Error("Inproper input data format.");

        var result = [],
            tranfs = {};

        Object.keys(spec).forEach(function(s){
            if(typeof(spec[s]) == "function") {
                tranfs[s] = spec[s];
            } else {
                //tranfs[s] = function(d) { return d[spec[s]]; };
                tranfs[s] = Function("$", "return " + spec[s] + ";");
            }
        });

        result = data.map(function(d){
            var item = {};
            Object.keys(spec).forEach(function(s){
                item[s] = tranfs[s].call(this, d);
            });
            return item;
        });
        return result;
    }
});
