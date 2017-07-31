define(function select(require){
    var ArrayOpts = require("../core/arrays.js");

    function _match(obj, spec, indexes){
        var match,
            opt,
            index,
            sat = true,
            keys = Object.keys(spec);

        keys.forEach(function(key){
            if(key === "$not") {
                match = !_match(obj, spec[key], indexes);
            } else if(key == "$or" || key == "$and" ) {
                match = (key == "$and");
                spec[key].forEach(function(s){
                    match = (key == "$and") ? match & _match(obj, s, indexes) : match | _match(obj, s, indexes);
                });
            } else {
                index = (indexes.length > 0) ? indexes.indexOf(key) : key;

                if(typeof spec[key] === 'object'){
                    opt = Object.keys(spec[key])[0];
                    console.log(opt);
                    if(opt[0] == "$" && spec[key][opt] instanceof Array){
                        if(opt == "$in" || opt == "$nin"){
                            match = ((opt == "$nin") ^ (spec[key][opt].indexOf(obj[index]) > -1));
                        } else if(opt == "$inRange"){
                            match =(obj[key] >= spec[key][opt][0] & obj[index] <= spec[key][opt][1]);
                        } else if(opt == "$ninRange"){
                            match =(obj[key] < spec[key][opt][0] | obj[index] > spec[key][opt][1]);
                        } else if(opt == "$inDate"){
                            match = (spec[key][opt].map(Number).indexOf(+(obj[index])) > -1);
                        }
                    } else if(spec[key] instanceof Array) {
                        console.log(spec[key]);
                        match =(obj[key] >= spec[key][0] & obj[index] <= spec[key][1]);
                    }
                } else if (Array.isArray(spec[key])) {
                    match = (obj[key] >= spec[key][0] & obj[index] <= spec[key][1]);
                } else {
                    if(spec[key][0] === "$")
                        match = (obj[spec[key].slice(1)] === obj[index]);
                    else
                        match = (spec[key] == obj[index]);
                }
            }
            sat = sat & match;
        });

        return sat;
    }

    return function(data, spec) {
        var indexes = data[0];

        if(!Array.isArray(indexes)) indexes = [];

        return data.filter(function(a){
            if(_match(a, spec, indexes)) return a;
        });
    };
});
