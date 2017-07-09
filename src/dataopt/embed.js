define(function(require){
    'use strict';
    function embed(spec) {
        var id = spec.$id || spec.$by,
            attributes = Object.keys(spec);

        if(!id) throw Error("No id specified for embed!");

        attributes.filter(function(attr){
            return (attr != "$by" && attr != "$id")
        })
        .forEach(function(attr){
            var embedKey = spec[attr][0][id],
                i = 0,
                n = data.length,
                l = spec[attr].length;

            var lookup = data.map(function(d){ d[attr] = []; return d[id];});

            for(i = 0; i < l; i++) {
                var index = lookup.indexOf(spec[attr][i][id]);
                if(index !== -1) {
                    data[index][attr].push(spec[attr][i]);
                }
                // delete spec[attr][i][id];
            }
        });
        return data;
    }
})
