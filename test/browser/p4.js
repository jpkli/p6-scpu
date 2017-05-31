(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
module.exports = function Arrays(require) {
    'use strict;';
    var array = {};
    function _reduce(array, opt) {
        var i, len = array.length, fn, result;
        switch (opt) {
        case 'max':
            result = array.reduce(function (a, b) {
                return a > b ? a : b;
            });
            break;
        case 'min':
            result = array.reduce(function (a, b) {
                return a < b ? a : b;
            });
            break;
        case 'and':
        case '&':
            result = array.reduce(function (a, b) {
                return a & b;
            });
            break;
        case 'or':
        case '|':
            result = array.reduce(function (a, b) {
                return a | b;
            });
            break;
        case 'mult':
        case '*':
            result = array.reduce(function (a, b) {
                return a * b;
            });
            break;
        default:
            result = array.reduce(function (a, b) {
                return a + b;
            });
            break;
        }
        return result;
    }
    array.reduce = function (opt) {
        return function (array) {
            var a = array instanceof Array ? array : Array.apply(null, arguments);
            return _reduce(a, opt);
        };
    };
    array.avg = function (array) {
        return _reduce(array, '+') / array.length;
    };
    array.normalize = function (array) {
        var max = _reduce(array, 'max'), min = _reduce(array, 'min'), range = max - min;
        return array.map(function (a) {
            return (a - min) / range;
        });
    };
    array.seq = function (start, end, intv) {
        var interval = intv || 1, array = [];
        for (var i = start; i <= end; i += interval)
            array.push(i);
        return array;
    };
    [
        'max',
        'min',
        'mult',
        'and',
        'or'
    ].forEach(function (f) {
        array[f] = array.reduce(f);
    });
    array.sum = array.reduce('+');
    array.scan = array.pfsum = function (a) {
        var pfsum = [], accum = 0;
        for (var i = 0; i < a.length; i++) {
            accum += a[i];
            pfsum.push(accum);
        }
        return pfsum;
    };
    array.iscan = function (a) {
        return array.scan([0].concat(a));
    };
    array.diff = function (a, b) {
        var difference = [];
        a.forEach(function (d) {
            if (b.indexOf(d) === -1) {
                difference.push(d);
            }
        });
        return difference;
    };
    array.intersect = function (a, b) {
        var t;
        if (b.length > a.length)
            t = b, b = a, a = t;
        return a.filter(function (e) {
            if (b.indexOf(e) !== -1)
                return true;
        });
    };
    array.unique = function (a) {
        return a.reduce(function (b, c) {
            if (b.indexOf(c) < 0)
                b.push(c);
            return b;
        }, []);
    };
    array.lcm = function (A) {
        var n = A.length, a = Math.abs(A[0]);
        for (var i = 1; i < n; i++) {
            var b = Math.abs(A[i]), c = a;
            while (a && b) {
                a > b ? a %= b : b %= a;
            }
            a = Math.abs(c * A[i]) / (a + b);
        }
        return a;
    };
    array.stats = function (array) {
        return {
            max: _reduce(array, 'max'),
            min: _reduce(array, 'min'),
            avg: array.avg(array)
        };
    };
    array.histogram = function (array, numBin, _max, _min) {
        var l = array.length, min = typeof _min == 'number' ? _min : _reduce(array, 'min'), max = typeof _max == 'number' ? _max : _reduce(array, 'max'), range = max - min, interval = range / numBin, bins = [], hg = new Array(numBin + 1).fill(0);
        for (var b = 0; b < numBin; b++) {
            bins.push([
                min + range * (b / numBin),
                min + range * (b + 1) / numBin
            ]);
        }
        for (var i = 0; i < l; i++) {
            binID = Math.floor((array[i] - min) / range * numBin);
            hg[binID]++;
        }
        ;
        hg[numBin - 1] += hg[numBin];
        return {
            bins: bins,
            counts: hg.slice(0, numBin)
        };
    };
    array.var = function (rowArray) {
        var m = _reduce(rowArray, '+') / rowArray.length, va = rowArray.map(function (a) {
                return Math.pow(a - m, 2);
            });
        return _reduce(va, '+') / (rowArray.length - 1);
    };
    array.std = function (rowArray) {
        return Math.sqrt(array.var(rowArray));
    };
    array.vectorAdd = function (a, b) {
        var c = [];
        a.forEach(function (v, i) {
            c[i] = v + b[i];
        });
        return c;
    };
    array.vectorSum = function (vectors) {
        var result = vectors[0], len = vectors[0].length;
        for (var i = 1; i < len; i++) {
            result = array.vectorAdd(result, vectors[i]);
        }
        return result;
    };
    return array;
}(require);
},{}],3:[function(require,module,exports){
module.exports = function (require) {
    'use strict;';
    function DataStruct(arg) {
        var ds = {}, array = arg.array || [], header = arg.header || array[0], types = arg.types || [], skip = arg.skip || 0, parsers = [], data = arg.data || [];
        if (types.length && typeof types == 'string') {
            var ta = [];
            for (var i = 0; i < header.length; i++) {
                ta.push(types);
            }
            types = ta;
        }
        if (typeof skip == 'number') {
            for (var j = 0; j < skip; j++)
                array.shift();
        }
        types.forEach(function (t) {
            parsers.push(getParser(t));
        });
        function parseDate(input) {
            var parts = input.split('-');
            return new Date(parts[0], parts[1] - 1, parts[2]);
        }
        function getParser(type) {
            if (type == 'int' || type.match('veci*')) {
                return function (value) {
                    return parseInt(value);
                };
            } else if (type == 'float' || type.match('vecf*')) {
                return function (value) {
                    return parseFloat(value);
                };
            } else if ([
                    'date',
                    'time',
                    'datetime'
                ].indexOf(type) != -1) {
                return function (value) {
                    return new Date(value);
                };
            } else if ([
                    'money',
                    'price',
                    'cost'
                ].indexOf(type) != -1) {
                return function (value) {
                    return parseFloat(value.substring(1));
                };
            } else {
                return function (value) {
                    return value;
                };
            }
        }
        ds.objectArray = function () {
            if (typeof header !== 'undefined' && header.length) {
                var l = header.length;
                array.forEach(function (a) {
                    var o = {}, offset = 0;
                    for (var i = 0; i < l; i++) {
                        var k = header[i];
                        if (k.length) {
                            if (types[i].match(/^(veci|vecf)\d+$/)) {
                                var vl = parseInt(types[i].slice(4)), vector = [];
                                a.slice(offset, offset + vl).forEach(function (vi) {
                                    vector.push(parsers[i](vi));
                                });
                                o[k] = vector;
                                offset += vl;
                            } else {
                                o[k] = parsers[i](a[offset]);
                                offset++;
                            }
                        }
                    }
                    data.push(o);
                });
            }
            data.join = function (_) {
                return leftJoin(data, _);
            };
            data.embed = function (spec) {
                var id = spec.$id || spec.$by, attributes = Object.keys(spec);
                if (!id)
                    throw Error('No id specified for embed!');
                attributes.filter(function (attr) {
                    return attr != '$by' && attr != '$id';
                }).forEach(function (attr) {
                    var embedKey = spec[attr][0][id], i = 0, n = data.length, l = spec[attr].length;
                    var lookup = data.map(function (d) {
                        d[attr] = [];
                        return d[id];
                    });
                    for (i = 0; i < l; i++) {
                        var index = lookup.indexOf(spec[attr][i][id]);
                        if (index !== -1) {
                            data[index][attr].push(spec[attr][i]);
                        }
                    }
                });
                return data;
            };
            return data;
        };
        ds.rowArray = function () {
            array.forEach(function (a) {
                var row = [];
                header.forEach(function (k, i) {
                    if (k.length) {
                        row.push(parsers[i](a[i]));
                    }
                });
                data.push(row);
            });
            return data;
        };
        ds.columnArray = function () {
            header.forEach(function (k, i) {
                var column = array.map(function (a) {
                    return a[i];
                });
                data.push(column);
            });
            return data;
        };
        return ds;
    }
    ;
    function leftJoin(oal, oar) {
        var len = oal.length, keyL = Object.keys(oal[0]), keyR = Object.keys(oar[0]);
        keys = keyR.filter(function (kr) {
            return keyL.indexOf(kr) === -1;
        });
        for (var i = 0; i < len; i++) {
            keys.forEach(function (k) {
                oal[i][k] = oar[i][k];
            });
        }
        return oal;
    }
    DataStruct.join = leftJoin;
    return DataStruct;
}(require);
},{}],4:[function(require,module,exports){
module.exports = function Pipeline(require) {
    var Transform = require('../dataopt/transform'), Derive = require('../dataopt/derive'), Queries = require('../dataopt/query');
    return function () {
        var queue = [], cache = {}, opt = {}, result;
        opt.transform = Transform;
        opt.derive = Derive;
        Object.keys(Queries).forEach(function (f) {
            opt[f] = Queries[f];
        });
        opt.cache = function (data, tag) {
            cache[tag] = pipeline.result();
        };
        opt.map = function (f) {
            result = data.map(f);
            return pipeline;
        };
        var pipeline = function (data) {
            result = data;
            queue.forEach(function (q) {
                var f = Object.keys(q)[0];
                result = opt[f](result, q[f]);
            });
            return result;
        };
        Object.keys(opt).forEach(function (o) {
            pipeline[o] = function (spec) {
                var task = {};
                task[o] = spec;
                queue.push(task);
                return pipeline;
            };
        });
        pipeline.result = function () {
            return result;
        };
        pipeline.queue = function () {
            return queue;
        };
        return pipeline;
    };
}(require);
},{"../dataopt/derive":7,"../dataopt/query":8,"../dataopt/transform":9}],5:[function(require,module,exports){
module.exports = function (require) {
    var ctypes = {
        int: Int32Array,
        short: Int16Array,
        float: Float32Array,
        double: Float64Array,
        string: Uint8Array
    };
    var query = { filter: require('./filter') };
    var filter = require('./filter');
    return function ColumnStore(option) {
        'use strict';
        var cstore = {}, columns = [], size = option.size || 0, count = option.count || 0, types = option.types || [], keys = option.keys || [], semantics = option.semantics || [], struct = option.struct || {}, CAMs = option.CAMs || {}, TLBs = option.TLBs || {}, colStats = {}, colAlloc = {}, colRead = {};
        if (option.struct)
            initStruct(option.struct);
        function initCStore() {
            if (size && types.length === keys.length && types.length > 0) {
                keys.forEach(function (c, i) {
                    configureColumn(i);
                    columns[i] = new colAlloc[c](size);
                });
                columns.keys = keys;
                columns.types = types;
                columns.struct = struct;
                columns.TLBs = TLBs;
                columns.CAMs = CAMs;
                columns.rows = size;
                columns.get = function (c) {
                    var index = keys.indexOf(c);
                    if (index < 0)
                        throw new Error('Error: No column named ' + c);
                    return columns[index];
                };
            }
            return cstore;
        }
        function initStruct(s) {
            struct = s;
            if (Array.isArray(struct)) {
                struct.forEach(function (s) {
                    keys.push(s.name);
                    types.push(s.type);
                    semantics.push(s.semantic || 'numerical');
                });
            } else {
                for (var k in struct) {
                    keys.push(k);
                    types.push(struct[k]);
                }
            }
            return initCStore();
        }
        function configureColumn(cid) {
            if (typeof cid == 'string')
                cid = keys.indexOf(cid);
            var f = keys[cid];
            colAlloc[f] = ctypes[types[cid]];
            if (colAlloc[f] === ctypes.string) {
                TLBs[f] = [];
                CAMs[f] = {};
                colRead[f] = function (value) {
                    if (!CAMs[f][value]) {
                        TLBs[f].push(value);
                        CAMs[f][value] = TLBs[f].length;
                        return TLBs[f].length;
                    } else {
                        return CAMs[f][value];
                    }
                };
            } else if (colAlloc[f] === ctypes.int || colAlloc[f] === ctypes.short) {
                colRead[f] = function (value) {
                    return parseInt(value);
                };
            } else if (colAlloc[f] === ctypes.float || colAlloc[f] === ctypes.double) {
                colRead[f] = function (value) {
                    return parseFloat(value);
                };
            } else {
                throw new Error('Invalid data type for TypedArray data!');
            }
        }
        cstore.addRows = function (rowArray) {
            rowArray.forEach(function (row) {
                row.forEach(function (v, j) {
                    columns[j][count] = colRead[keys[j]](v);
                });
                count++;
            });
            return count;
        };
        cstore.addColumns = function (columnArray, columnName, columnType) {
            var cid = keys.indexOf(columnName);
            if (cid < 0) {
                keys.push(columnName);
                types.push(columnType);
                configureColumn(columnName);
                cid = types.length - 1;
            }
            if (columnArray instanceof ctypes[types[cid]]) {
                columns[columnName] = columnArray;
            } else if (ArrayBuffer.isView(columnArray)) {
                columns[columnName] = new colAlloc[columnName](columnArray);
            } else {
                throw new Error('Error: Invalid data type for columnArray!');
            }
            count = columnArray.length;
        };
        cstore.metadata = cstore.info = function () {
            return {
                size: size,
                count: count,
                keys: keys,
                types: types,
                semantics: semantics,
                TLBs: TLBs,
                CAMs: CAMs,
                stats: cstore.stats()
            };
        };
        cstore.data = cstore.columns = function () {
            return columns;
        };
        cstore.stats = function (col) {
            var col = col || keys;
            col.forEach(function (name, c) {
                if (!colStats[c]) {
                    var min, max, avg;
                    min = max = avg = columns[c][0];
                    for (var i = 1; i < columns[c].length; i++) {
                        var d = columns[c][i];
                        if (d > max)
                            max = d;
                        else if (d < min)
                            min = d;
                        avg = avg - (avg - d) / i;
                    }
                    if (max == min)
                        max += 0.000001;
                    colStats[c] = {
                        min: min,
                        max: max,
                        avg: avg
                    };
                }
            });
            return colStats;
        };
        cstore.ctypes = function () {
            return ctypes;
        };
        cstore.size = size;
        cstore.filter = function (spec) {
            columns = filter(columns, spec);
            return cstore;
        };
        return initCStore();
    };
}(require);
},{"./filter":6}],6:[function(require,module,exports){
module.exports = function (require) {
    var arrays = require('../core/arrays');
    return function filter(data, spec) {
        var queries = Object.keys(spec), resultTotal = data[0].length, resultIDx = arrays.seq(0, resultTotal - 1);
        queries.forEach(function (query) {
            var result = [], fieldID = data.keys.indexOf(query);
            for (var i = 0; i < resultTotal; i++) {
                var pos = resultIDx[i];
                if (data[fieldID][pos] == spec[query])
                    result.push(pos);
            }
            resultTotal = result.length;
            resultIDx = result;
        });
        for (var i = 0, l = data.length; i < l; i++) {
            var newColumn = new data[i].constructor(resultIDx.length);
            for (var j = 0; j < resultTotal; j++) {
                newColumn[j] = data[i][resultIDx[j]];
            }
            data[i] = newColumn;
        }
        data.rows = resultTotal;
        return data;
    };
}(require);
},{"../core/arrays":2}],7:[function(require,module,exports){
module.exports = function Derive(require) {
    'use strict;';
    var $ = require('../core/arrays');
    return function (data, spec) {
        if (!Array.isArray(data))
            throw new Error('Inproper input data format.');
        if (typeof spec === 'function') {
            data.forEach(spec);
        } else {
            var result = [], tranfs = {};
            Object.keys(spec).forEach(function (s) {
                if (typeof spec[s] == 'function') {
                    tranfs[s] = function (d) {
                        d[s] = spec[s](d);
                    };
                } else {
                    tranfs[s] = Function('attr', 'attr.' + s + '=' + spec[s].replace(/@/g, 'attr.').replace(/\$/g, '$.') + ';');
                }
            });
            data.forEach(function (d) {
                Object.keys(spec).forEach(function (s) {
                    tranfs[s](d);
                });
            });
        }
        return data;
    };
}(require);
},{"../core/arrays":2}],8:[function(require,module,exports){
module.exports = function Query(require) {
    var query = {}, ArrayOpts = require('../core/arrays.js');
    function _match(obj, spec, indexes) {
        var match, opt, index, sat = true, keys = Object.keys(spec);
        keys.forEach(function (key) {
            if (key === '$not') {
                match = !_match(obj, spec[key], indexes);
            } else if (key == '$or' || key == '$and') {
                match = key == '$and';
                spec[key].forEach(function (s) {
                    match = key == '$and' ? match & _match(obj, s, indexes) : match | _match(obj, s, indexes);
                });
            } else {
                index = indexes.length > 0 ? indexes.indexOf(key) : key;
                if (typeof spec[key] === 'object') {
                    opt = Object.keys(spec[key])[0];
                    if (opt[0] == '$' && spec[key][opt] instanceof Array) {
                        if (opt == '$in' || opt == '$nin') {
                            match = opt == '$nin' ^ spec[key][opt].indexOf(obj[index]) > -1;
                        } else if (opt == '$inRange') {
                            match = obj[key] > spec[key][opt][0] & obj[index] < spec[key][opt][1];
                        } else if (opt == '$ninRange') {
                            match = obj[key] < spec[key][opt][0] | obj[index] > spec[key][opt][1];
                        } else if (opt == '$inDate') {
                            match = spec[key][opt].map(Number).indexOf(+obj[index]) > -1;
                        }
                    }
                } else {
                    if (spec[key][0] === '$')
                        match = obj[spec[key].slice(1)] === obj[index];
                    else
                        match = spec[key] == obj[index];
                }
            }
            sat = sat & match;
        });
        return sat;
    }
    query.match = function (data, spec) {
        var indexes = data[0];
        if (!Array.isArray(indexes))
            indexes = [];
        return data.filter(function (a) {
            if (_match(a, spec, indexes))
                return a;
        });
    };
    query.indexBy = function (data, id) {
        var indexed = {};
        data.forEach(function (d) {
            if (!indexed.hasOwnProperty(d[id])) {
                indexed[d[id]] = [d];
            } else {
                indexed[d[id]].push(d);
            }
        });
        return indexed;
    };
    query.range = function (data, id) {
        var array = data.map(function (d) {
            return d[id];
        });
        return [
            ArrayOpts.min(array),
            ArrayOpts.max(array)
        ];
    };
    query.map = function (data, m) {
        var mf = function (d) {
            return d;
        };
        if (typeof m === 'string')
            mf = function (d) {
                return d[m];
            };
        else if (typeof m === 'function')
            mf = m;
        return data.map(mf);
    };
    Object.keys(ArrayOpts).forEach(function (opt) {
        query[opt] = function (data, id) {
            var arr = query.map(data, id);
            return ArrayOpts[opt](arr);
        };
    });
    query.group = function (data, spec, headers) {
        var i, l = data.length, attributes = headers || Object.keys(data[0]), keys = Object.keys(spec), bin, bins = [], binCollection = {}, result = [], ks;
        if (keys.indexOf('$by') < 0)
            return result;
        for (i = 0; i < l; i++) {
            if (spec.$by instanceof Array) {
                ks = [];
                spec.$by.forEach(function (si) {
                    ks.push(data[i][si]);
                });
                bin = JSON.stringify(ks);
            } else {
                bin = data[i][spec.$by];
            }
            if (bins.indexOf(bin) < 0) {
                bins.push(bin);
                binCollection[bin] = [data[i]];
            } else {
                binCollection[bin].push(data[i]);
            }
        }
        var bl = bins.length;
        for (i = 0; i < bl; i++) {
            var res = {};
            if (spec.$by instanceof Array) {
                ks = JSON.parse(bins[i]);
                spec.$by.forEach(function (s, j) {
                    res[s] = ks[j];
                });
            } else {
                res[spec.$by] = bins[i];
            }
            if (spec.$data) {
                res.data = binCollection[bins[i]];
            }
            keys.forEach(function (key) {
                if (key == '$by' || key == '$data')
                    return;
                var attr, opt = spec[key];
                if (attributes.indexOf(key) !== -1 || opt === '$count') {
                    attr = key;
                } else {
                    console.log(spec[key], key);
                    attr = Object.keys(spec[key])[0];
                    opt = spec[key][attr];
                    if (attributes.indexOf(attr) === -1)
                        throw new Error('No matching attribute or operation defined for the new attribute', attr);
                }
                if (typeof opt === 'function') {
                    res[key] = opt.call(null, binCollection[bins[i]].map(function (a) {
                        return a[attr];
                    }));
                } else if (typeof opt === 'string') {
                    if (opt === '$addToSet') {
                        res[key] = ArrayOpts.unique(binCollection[bins[i]].map(function (a) {
                            return a[key];
                        }));
                    } else if (opt === '$addToArray') {
                        res[key] = binCollection[bins[i]].map(function (a) {
                            return a[attr];
                        });
                    } else if (opt === '$count') {
                        res[key] = binCollection[bins[i]].length;
                    } else {
                        var fname = opt.slice(1);
                        if (fname in ArrayOpts) {
                            res[key] = ArrayOpts[fname].call(null, binCollection[bins[i]].map(function (a) {
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
    query.sortBy = function (data, spec) {
        function sortArray(a, b, p) {
            return a[p] > b[p] ? 1 : a[p] < b[p] ? -1 : 0;
        }
        return data.sort(function (a, b) {
            var r = 0, i = 0, attributes = Object.keys(spec), al = attributes.length;
            while (r === 0 && i < al) {
                r = sortArray(a, b, attributes[i]) * spec[attributes[i]];
                i++;
            }
            return r;
        });
    };
    query.orderBy = function (c, s, o) {
        var spec = {};
        s.forEach(function (ss) {
            spec[ss] = o;
        });
        return query.sort(c, spec);
    };
    query.histogram = function (data, spec, max, min) {
        var result = {};
        for (var key in spec) {
            result[key] = ArrayOpts.histogram(data.map(function (d) {
                return d[key];
            }), spec[key], max, min);
        }
        return result;
    };
    query.binAggregate = function (data, spec) {
        var attrKey = Object.keys(spec)[0], attributes = Object.keys(spec).filter(function (k) {
                return k != '$data' && k != attrKey;
            }) || [], embedData = spec.$data || false, numBin = spec[attrKey], array = data.map(function (d) {
                return d[attrKey];
            }), l = array.length, min = ArrayOpts.min(array), max = ArrayOpts.max(array), range = max - min, interval = range / numBin, bins = [];
        for (var b = 0; b < numBin; b++) {
            bins[b] = {
                binID: b,
                rangeBegin: min + range * (b / numBin),
                rangeEnd: min + range * (b + 1) / numBin,
                count: 0
            };
            if (embedData)
                bins[b].data = [];
        }
        for (var i = 0; i < l; i++) {
            binID = Math.floor((array[i] - min) / range * numBin);
            if (binID == numBin)
                binID--;
            data[i].binID = binID;
        }
        spec.$by = 'binID';
        delete spec[attrKey];
        var result = query.group(data, spec);
        result = query.indexBy(result, 'binID');
        bins.forEach(function (bin) {
            if (result.hasOwnProperty(bin.binID)) {
                attributes.forEach(function (attr) {
                    bin[attr] = result[bin.binID][0][attr];
                });
                if (embedData)
                    bin.data = result[bin.binID][0].data;
            } else {
                attributes.forEach(function (attr) {
                    bin[attr] = 0;
                });
            }
        });
        console.log(bins);
        return bins;
    };
    query.partition = function (data, numPart) {
        var len = data.length, p = Math.ceil(len / numPart), pid, partitions = [];
        for (var b = 0; b < numPart; b++) {
            partitions[b] = {
                partition: b,
                data: [],
                count: 0
            };
        }
        for (var i = 0; i < len; i++) {
            pid = Math.floor(i / p);
            partitions[pid].data.push(data[i]);
            partitions[pid].count++;
        }
        return partitions;
    };
    query.normalize = function (data, fields) {
        var hash = {};
        fields.forEach(function (f) {
            var array = data.map(function (d) {
                return d[f];
            });
            hash[f] = ArrayOpts.normalize(array);
        });
        data.forEach(function (d, i) {
            fields.forEach(function (f) {
                d[f] = hash[f][i];
            });
        });
        return data;
    };
    return query;
}(require);
},{"../core/arrays.js":2}],9:[function(require,module,exports){
module.exports = function Query(require) {
    return function Transform(data, spec) {
        if (!Array.isArray(data))
            throw new Error('Inproper input data format.');
        var result = [], tranfs = {};
        Object.keys(spec).forEach(function (s) {
            if (typeof spec[s] == 'function') {
                tranfs[s] = spec[s];
            } else {
                tranfs[s] = Function('$', 'return ' + spec[s] + ';');
            }
        });
        result = data.map(function (d) {
            var item = {};
            Object.keys(spec).forEach(function (s) {
                item[s] = tranfs[s].call(this, d);
            });
            return item;
        });
        return result;
    };
}(require);
},{}],10:[function(require,module,exports){
(function (global){
var root = typeof self == 'object' && self.self === self && self ||
           typeof global == 'object' && global.global === global && global ||
           this;

root.p4 = {
    arrays          : require("./core/arrays"),
    pipeline        : require("./core/pipeline"),
    datastruct      : require('./core/datastruct'),


    cstore      : require("./cquery/cstore"),


    io: {
        ajax        : require("./io/ajax"),
        csv         : require("./io/node-dsv"),
        printformat : require("./io/printformat"),
        parser      : require("./io/parser")
    },
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./core/arrays":2,"./core/datastruct":3,"./core/pipeline":4,"./cquery/cstore":5,"./io/ajax":11,"./io/node-dsv":12,"./io/parser":13,"./io/printformat":14}],11:[function(require,module,exports){
module.exports = function Ajax() {
    'use strict;';
    var ajax = {};
    ajax.request = function (arg) {
        var url = arg.url || arg, method = arg.method || 'GET', dataType = arg.dataType || 'json', data = arg.data || [], query = [];
        for (var key in data) {
            query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
        }
        return new Promise(function (resolve, reject) {
            var req = new XMLHttpRequest();
            req.open(method, url);
            req.responseType = dataType;
            req.onload = function () {
                if (req.status == 200) {
                    resolve(req.response);
                } else {
                    reject(Error(req.statusText));
                }
            };
            req.onerror = function () {
                reject(Error('Network Error'));
            };
            if (method == 'POST') {
                req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            }
            req.send(data);
        });
    };
    ajax.get = ajax.request;
    ajax.getAll = function (options) {
        var promises = [];
        options.forEach(function (option) {
            promises.push(ajax.get(option).then(function (result) {
                return new Promise(function (resolve, reject) {
                    resolve(result);
                });
            }));
        });
        return Promise.all(promises);
    };
    ajax.post = function (arg) {
        arg.method = 'POST';
        return ajax.request(arg);
    };
    return ajax;
}();
},{}],12:[function(require,module,exports){
module.exports = function nodeDSV(require) {
    'use strict;';
    var dsv = {}, fs = require('fs');
    dsv.read = function (option) {
        var rowArray = [], metadata = {}, skipRow = 0;
        function onFileOpen() {
        }
        function onChunkLoad(rows) {
            rowArray = rowArray.concat(rows);
        }
        function onComplete() {
        }
        var filepath = option.filepath, bufferSize = option.bufferSize || option.chunkSize || 8 * 1024, textEncoding = option.textEncoding || 'utf-8', delimiter = option.delimiter || ',', onopen = option.onopen || onFileOpen, onload = option.onload || onChunkLoad, oncomplete = option.oncomplete || onComplete;
        metadata.types = option.types;
        metadata.header = option.header;
        skipRow = option.skip || 0;
        function createReadStream() {
            return fs.createReadStream(filepath, {
                flags: 'r',
                fd: null,
                mode: 438,
                encoding: textEncoding,
                bufferSize: bufferSize
            });
        }
        function getLineCount(callback) {
            var stream = createReadStream(), lineCount = 0;
            stream.on('data', function (data) {
                for (var i = 0, l = data.length; i < l; i++)
                    if (data.charCodeAt(i) === 10)
                        lineCount++;
            });
            stream.on('error', function () {
                throw Error('Error during reading file.');
            });
            stream.on('end', function () {
                callback(lineCount);
            });
        }
        function loadCSV(delimiter, onChunk, onComplete) {
            var stream = createReadStream(), leftOver = '';
            stream.on('data', function (data) {
                var loaded = 0, rows = [];
                data = leftOver + data;
                rows = data.split('\n');
                leftOver = rows.pop();
                rows = rows.map(function (r) {
                    return r.split(delimiter);
                });
                onChunk(rows);
            });
            stream.on('error', function () {
                throw Error('Error during reading file.');
            });
            stream.on('end', function () {
                if (leftOver.length) {
                    onChunk([leftOver.split(delimiter)]);
                }
                onComplete(rowArray);
            });
        }
        return getLineCount(function (numRow) {
            onopen(numRow);
            loadCSV(delimiter, onload, oncomplete);
        });
    };
    return dsv;
}(require);
},{"fs":1}],13:[function(require,module,exports){
module.exports = function (require) {
    'use strict';
    return function parseDSV(text, delimiter) {
        var a = [], lines = text.split('\n');
        if (lines[lines.length - 1].split(delimiter) < 2)
            lines.pop();
        lines.forEach(function (line) {
            a.push(loadLine(line, delimiter.charCodeAt(0), 0).fields);
        });
        return a;
    };
}(require);
},{}],14:[function(require,module,exports){
module.exports = function (require) {
    var seq = require('../core/arrays.js').seq;
    function stringToNumber(s) {
        var symbols = [
                'y',
                'z',
                'a',
                'f',
                'p',
                'n',
                'µ',
                'm',
                '',
                'k',
                'M',
                'G',
                'T',
                'P',
                'E',
                'Z',
                'Y'
            ], exp = seq(-24, 24, 3);
        return parseFloat(s) * Math.pow(10, exp(symbols.indexOf(s[s.length - 1])));
    }
    return function printformat(spec) {
        'user strict;';
        return function (value) {
            if (typeof value !== 'number')
                return value;
            var ret, convert, numericSymbols = [
                    'y',
                    'z',
                    'a',
                    'f',
                    'p',
                    'n',
                    'µ',
                    'm',
                    '',
                    'k',
                    'M',
                    'G',
                    'T',
                    'P',
                    'E',
                    'Z',
                    'Y'
                ], n = seq(-24, 24, 3), i = numericSymbols.length - 1, parts, precision = spec.match(/\d+/)[0] || 3, number = Number(value), exp, suffix;
            if (spec[spec.length - 1] == 's')
                precision--;
            parts = number.toExponential(precision).toString().match(/^(-{0,1})(\d+)\.?(\d*)[eE]([+-]?\d+)$/);
            exp = parseInt(parts[4]) || 0;
            while (i--) {
                if (exp >= n[i]) {
                    if (i == 7 && exp - n[i] > 1) {
                        suffix = numericSymbols[i + 1];
                        exp -= n[i + 1];
                        break;
                    } else {
                        suffix = numericSymbols[i];
                        exp -= n[i];
                        break;
                    }
                }
            }
            ret = parseFloat(parts[1] + parts[2] + '.' + (parts[3] || 0) + 'e' + exp.toString());
            return ret.toString() + suffix;
        };
    };
}(require);
},{"../core/arrays.js":2}]},{},[10]);
