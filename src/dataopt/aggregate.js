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

        if(keys.indexOf("$group") < 0 && keys.indexOf("$bin") < 0) return result;

        if(typeof spec.$bin == 'object') {
            var binAttr = Object.keys(spec.$bin)[0],
                binCount = spec.$bin[binAttr];

            if(attributes.indexOf(binAttr) !== -1) {
                var column = data.map(function(d){return d[binAttr]}),
                    min = ArrayOpts.min(column),
                    max = ArrayOpts.max(column),
                    binInterval = (max - min) / binCount;

                for(i = 0; i < l; i++){
                    data[i]['bin@' + binAttr] = Math.min(Math.floor(data[i][binAttr]/binInterval), binCount-1);
                }

                spec.$group = 'bin@' + binAttr;
                attributes.push('bin@' + binAttr);
            }
        }

        for(i = 0; i < l; i++){
            if(Array.isArray(spec.$group)) {
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
            if(Array.isArray(spec.$group)) {
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

            if(spec.$group) {
                var gkeys = Array.isArray(spec.$group) ? spec.$group : [spec.$group];

                gkeys.forEach(function(gk){
                    if(attributes.indexOf(gk) === -1)
                        throw Error('Invalid attribute name: ', gk);
                })
            }

            keys = keys.filter(function(k){ return ["$bin", "$group"].indexOf(k) === -1; });

            keys.forEach(function(key){
                var attr = key,
                    opt = spec[key];

                if(opt === "$count" || opt === "$data") {
                    attr = key;
                }
                if(typeof spec[key] === 'object'){
                    opt = Object.keys(spec[key])[0];
                    attr = spec[key][opt];


                    if(attributes.indexOf(attr) === -1 && attr !== "*" && !Array.isArray(attr)) {
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

                        res[key] = (spec[key][opt] == '*')
                            ? binCollection[bins[i]]
                            : binCollection[bins[i]].map(function(data){
                                var row = {};
                                spec[key][opt].forEach(function(k){ row[k] = data[k] });
                                return row;
                            });
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
