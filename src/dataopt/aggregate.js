define(function(require){
    var ArrayOpts = require("../core/arrays.js");
    return function(data, spec, headers){
        var i,
            l = data.length,
            attributes = headers || Object.keys(data[0]),
            keys = Object.keys(spec),
            bin,
            bins = [],
            binCollection = {},
            result = [],
            ks;

        if(keys.indexOf("$group") < 0) return result;

        for(i = 0; i < l; i++){
            if(spec.$group instanceof Array) {
                ks = [];
                spec.$group.forEach(function(si){
                    ks.push(data[i][si]);
                });
                bin = JSON.stringify(ks);
            } else {
                bin = data[i][spec.$group];
            }
            if( bins.indexOf(bin) < 0 ){
                bins.push(bin);
                binCollection[bin] = [data[i]];
            } else {
                binCollection[bin].push(data[i]);
            }
        }

        var bl = bins.length;

        for(i = 0; i < bl; i++){
            var res = {};
            if(spec.$group instanceof Array) {
                ks = JSON.parse(bins[i]);
                spec.$group.forEach(function(s, j){
                    res[s] = ks[j];
                })

            } else {
                res[spec.$group] = bins[i];
            }

            if(spec.$data) {
                res.data = binCollection[bins[i]];
            }

            keys.forEach(function(key){
                if(key == "$group" || key == "$data") return;

                var attr,
                    opt = spec[key];

                if(attributes.indexOf(key) !== -1 || opt === "$count") {
                    attr = key;
                } else {

                    attr = Object.keys(spec[key])[0];
                    opt = spec[key][attr];
                    if(attributes.indexOf(attr) === -1 ) {
                        var warnMsg = "No matching attribute or operation defined for the new attribute " + key + ":" + spec[key];
                        console.warn(warnMsg);
                        return;
                    }
                }

                if(typeof opt === "function") {
                    // res[key] = binCollection[bins[i]].map(function(a){ return a[attr]; }).reduce(opt);
                    res[key] = opt.call(null, binCollection[bins[i]].map(function(a){ return a[attr]; }));
                } else if(typeof opt === "string") {
                    if(opt === "$unique") {
                        res[key] = ArrayOpts.unique(binCollection[bins[i]].map(function(a){ return a[key]; }));
                    } else if (opt === "$list") {
                        res[key] = binCollection[bins[i]].map(function(a){ return a[attr]; });
                    } else if (opt === "$first") {
                        res[key] = binCollection[bins[i]][0][attr];
                    } else if (opt === "$merge") {
                        var mergedResult = [];
                        binCollection[bins[i]].map(function(a){ return a[attr]; }).forEach(function(m){
                            mergedResult = mergedResult.concat(m);
                        })
                        res[key] = mergedResult;
                    } else if (opt === "$count") {
                        res[key] = binCollection[bins[i]].length;
                    } else if (opt === "$data") {
                        res[key] = binCollection[bins[i]];
                    } else {
                        var fname = opt.slice(1);
                        if(fname in ArrayOpts) {
                            res[key] = ArrayOpts[fname].call(null, binCollection[bins[i]].map(function(a){
                                return a[attr];
                            }));
                        }
                    }
                }
            });
            result.push(res);
        }

        return result;
    };

})
