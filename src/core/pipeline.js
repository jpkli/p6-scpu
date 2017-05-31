if (typeof(define) !== 'function') var define = require('amdefine')(module);

define(function Pipeline(require){
    var Transform = require('../dataopt/transform'),
        Derive = require('../dataopt/derive'),
        Queries = require('../dataopt/query');

    return function(){
        var queue = [],
            cache = {},
            opt = {},
            result;

        opt.transform = Transform;
        opt.derive = Derive;

        Object.keys(Queries).forEach(function(f) {
            opt[f] = Queries[f];
        });

        opt.cache = function(data, tag){
            cache[tag] = pipeline.result();
        };

        opt.map = function(f){
            result = data.map(f);
            return pipeline;
        };

        var pipeline = function(data) {
            result = data;

            queue.forEach(function(q){
                var f = Object.keys(q)[0];
                result = opt[f](result, q[f]);
            });
            return result;
        }

        // pipeline.opt = opt;

        Object.keys(opt).forEach(function(o){
            pipeline[o] = function(spec) {
                var task = {};
                task[o] = spec;
                queue.push(task);
                return pipeline;
            };
        })

        pipeline.result = function() {
            return result;
        };

        pipeline.queue = function() {
            return queue;
        }

        return pipeline;
    }
});
