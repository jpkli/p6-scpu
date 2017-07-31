if (typeof(define) !== 'function') var define = require('amdefine')(module);

define(function Query(require){
    var query = {},
        ArrayOpts = require("../core/arrays.js");

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
                        match =(obj[key] >= spec[key][0] & obj[index] <= spec[key][1]);
                    }
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

    query.match = function(data, spec) {
        var indexes = data[0];

        if(!Array.isArray(indexes)) indexes = [];

        return data.filter(function(a){
            if(_match(a, spec, indexes)) return a;
        });
    };

    query.indexBy = function(data, id){
        var indexed = {};

        data.forEach(function(d){

            if(!indexed.hasOwnProperty(d[id])){
                indexed[d[id]] = [ d ];
            } else {
                indexed[d[id]].push(d);
            }
            // delete d[id];
        });

        return indexed;
    };

    // query.list = function(data, id) {
    //     return data.map(function(d){return d[id];});
    // }

    query.range = function(data, id) {
        var array = data.map(function(d){return d[id];});
        return [ ArrayOpts.min(array), ArrayOpts.max(array) ];
    };

    query.map = function(data, m) {
        var mf = function(d){return d};
        if(typeof m === "string")
            mf = function(d){return d[m]};
        else if(typeof m === "function")
            mf = m;

        return data.map(mf);
    };

    Object.keys(ArrayOpts).forEach(function(opt) {
        query[opt] = function(data, id) {
            var arr = query.map(data, id);
            return ArrayOpts[opt](arr);
        }
    });

    query.group = function(data, spec, headers){
        var i,
            l = data.length,
            attributes = headers || Object.keys(data[0]),
            keys = Object.keys(spec),
            bin,
            bins = [],
            binCollection = {},
            result = [],
            ks;

        if(keys.indexOf("$by") < 0) return result;

        for(i = 0; i < l; i++){
            if(spec.$by instanceof Array) {
                ks = [];
                spec.$by.forEach(function(si){
                    ks.push(data[i][si]);
                });
                bin = JSON.stringify(ks);
            } else {
                bin = data[i][spec.$by];
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
            if(spec.$by instanceof Array) {
                ks = JSON.parse(bins[i]);
                spec.$by.forEach(function(s, j){
                    res[s] = ks[j];
                })

            } else {
                res[spec.$by] = bins[i];
            }

            if(spec.$data) {
                res.data = binCollection[bins[i]];
            }


            keys.forEach(function(key){
                if(key == "$by" || key == "$data") return;

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
                        // throw new Error(warnMsg);
                        return;
                    }
                }

                if(typeof opt === "function") {
                    // res[key] = binCollection[bins[i]].map(function(a){ return a[attr]; }).reduce(opt);
                    res[key] = opt.call(null, binCollection[bins[i]].map(function(a){ return a[attr]; }));
                } else if(typeof opt === "string") {
                    if(opt === "$addToSet") {
                        res[key] = ArrayOpts.unique(binCollection[bins[i]].map(function(a){ return a[key]; }));
                    } else if (opt === "$addToArray") {
                        res[key] = binCollection[bins[i]].map(function(a){ return a[attr]; });
                    } else if (opt === "$first") {
                        res[key] = binCollection[bins[i]][0][attr];
                    } else if (opt === "$mergeArray") {
                        var mergedResult = [];
                        binCollection[bins[i]].map(function(a){ return a[attr]; }).forEach(function(m){
                            mergedResult = mergedResult.concat(m);
                        })
                        res[key] = mergedResult;
                    } else if (opt === "$count") {
                        res[key] = binCollection[bins[i]].length;
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

    query.sortBy = function(data, spec) {
        function sortArray(a, b, p) {
            return a[p] > b[p] ? 1 : a[p] < b[p] ? -1 : 0;
        }
        return data.sort(function(a, b){
            var r = 0,
                i = 0,
                attributes = Object.keys(spec),
                al = attributes.length;

            while( r === 0 && i < al ) {
                r = sortArray(a, b, attributes[i]) * spec[attributes[i]];
                i++;
            }
            return r;
        })
    };

    query.orderBy = function(c, s, o) {
        var spec = {};
        s.forEach(function(ss){
            spec[ss] = o;
        });
        return query.sort(c, spec);
    };

    query.histogram = function(data, spec, max, min) {
        var result = {};
        for(var key in spec) {
            result[key] = ArrayOpts.histogram(data.map(function(d){return d[key]}), spec[key], max, min);
        }
        return result;
    };

    query.binAggregate = function(data, spec) {
        var attrKey = Object.keys(spec)[0],
            attributes = Object.keys(spec).filter(function(k) { return k != "$data" && k!=attrKey;}) || [],
            embedData = spec.$data || false,
            numBin = spec[attrKey],
            array = data.map(function(d){ return d[attrKey]; }),
            l = array.length,
            min = ArrayOpts.min(array),
            max = ArrayOpts.max(array),
            range = max - min,
            interval = range / numBin,
            bins = [];


        for(var b = 0; b < numBin; b++) {
            bins[b] = {binID: b, rangeBegin: min + range * (b/(numBin)), rangeEnd: min + range*(b+1)/(numBin), count: 0};
            // if(embedData)
                bins[b].data = [];
            // attributes.forEach(function(attr){
            //     bins[b][attr] = 0;
            // })
        }

        // bins[numBin] = [];

        for(var i = 0; i < l; i++) {
            binID = Math.floor( (array[i] - min) / range * (numBin));
            if(binID == numBin) binID--;
            data[i].binID = binID;
            // if(embedData)
                bins[binID].data.push(data[i]);
            // bins[binID].count++;
            // attributes.forEach(function(attr){
            //     bins[binID][attr] += data[i][attr];
            // });
        }

        spec.$by = "binID";
        delete spec[attrKey];

        var result = query.group(data, spec);
        result = query.indexBy(result, "binID");


        // result.forEach(function(r){
        //     r.rangeBegin = bins[r.binID].rangeBegin;
        //     r.rangeEnd = bins[r.binID].rangeEnd;
        // })

        bins.forEach(function(bin){

            if(result.hasOwnProperty(bin.binID)) {
                attributes.forEach(function(attr){
                    bin[attr] = result[bin.binID][0][attr];
                });
                if(embedData) bin.data = result[bin.binID][0].data;
            } else {
                attributes.forEach(function(attr){
                    bin[attr] = 0;
                });
            }

        })
        // console.log(bins);
        // return result;
        return bins;
    }

    query.partition = function(data, numPart) {
        var len = data.length,
            p = Math.ceil(len / numPart),
            pid,
            partitions = [];

        for(var b = 0; b < numPart; b++) {
            partitions[b] = {partition: b, data: [], count: 0};
        }

        for(var i = 0; i < len; i++) {
            pid = Math.floor(i / p);
            partitions[pid].data.push(data[i]);
            partitions[pid].count++;
        }

        return partitions;
    }

    query.partitionBy = function(data, spec) {
        var len = data.length,
            pid,
            partitions = [],
            key = Object.keys(spec)[0],
            parts = spec[key];

        parts.forEach(function(b, bi) {
            partitions[bi] = {partition: bi, data: [], count: 0, name: b};
        })

        for(var i = 0; i < len; i++) {
            pid = parts.indexOf(data[i][key]);
            if(pid>-1){
                partitions[pid].data.push(data[i]);
                partitions[pid].count++;
            }
        }
        return partitions;
    }

    query.normalize = function(data, fields) {
        var hash = {};

        fields.forEach(function(f){
            var array = data.map(function(d){ return d[f]; });
            hash[f] = ArrayOpts.normalize(array);
        });

        data.forEach(function(d, i){
            fields.forEach(function(f){
                d[f] = hash[f][i];
            });
        });

        return data;
    }

    query.toColumnArray = function(data) {
        var columnArray = [];
            attributes = Object.keys(data[0]).filter(function(k) { return k; });

        attributes.forEach(function(attr){
            columnArray.push(data.map(function(d){return d[attr];}));
        });

        columnArray.fields = attributes;

        attributes.forEach(function(attr, ai){
            columnArray[attr] = columnArray[ai];
        });

        return columnArray;
    }

    return query;
});
