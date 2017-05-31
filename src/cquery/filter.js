if (typeof(define) !== 'function') var define = require('amdefine')(module);

define(function(require){
    var arrays = require('../core/arrays');

    return function filter(data, spec) {
        var queries = Object.keys(spec),
            resultTotal = data[0].length,
            resultIDx = arrays.seq(0, resultTotal-1);

        queries.forEach(function(query){
            var result = [],
                fieldID = data.keys.indexOf(query);
            for(var i = 0; i < resultTotal; i++) {
                var pos = resultIDx[i];

                if(data[fieldID][pos] == spec[query]) result.push(pos);
            }
            resultTotal = result.length;
            resultIDx = result;
        })

        for(var i = 0, l=data.length; i < l; i++){
            var newColumn = new data[i].constructor(resultIDx.length);
            for(var j = 0; j < resultTotal; j++){
                newColumn[j] = data[i][resultIDx[j]];
            }
            data[i] = newColumn;
        }

        data.rows = resultTotal;
        return data;
    }
})
