(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":3}],3:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
var p4 = require('./src/util/wrap.js');

module.exports = p4;

},{"./src/util/wrap.js":25}],5:[function(require,module,exports){
(function (process,__filename){
/** vim: et:ts=4:sw=4:sts=4
 * @license amdefine 1.0.1 Copyright (c) 2011-2016, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/amdefine for details
 */

/*jslint node: true */
/*global module, process */
'use strict';

/**
 * Creates a define for node.
 * @param {Object} module the "module" object that is defined by Node for the
 * current module.
 * @param {Function} [requireFn]. Node's require function for the current module.
 * It only needs to be passed in Node versions before 0.5, when module.require
 * did not exist.
 * @returns {Function} a define function that is usable for the current node
 * module.
 */
function amdefine(module, requireFn) {
    'use strict';
    var defineCache = {},
        loaderCache = {},
        alreadyCalled = false,
        path = require('path'),
        makeRequire, stringRequire;

    /**
     * Trims the . and .. from an array of path segments.
     * It will keep a leading path segment if a .. will become
     * the first path segment, to help with module name lookups,
     * which act like paths, but can be remapped. But the end result,
     * all paths that use this function should look normalized.
     * NOTE: this method MODIFIES the input array.
     * @param {Array} ary the array of path segments.
     */
    function trimDots(ary) {
        var i, part;
        for (i = 0; ary[i]; i+= 1) {
            part = ary[i];
            if (part === '.') {
                ary.splice(i, 1);
                i -= 1;
            } else if (part === '..') {
                if (i === 1 && (ary[2] === '..' || ary[0] === '..')) {
                    //End of the line. Keep at least one non-dot
                    //path segment at the front so it can be mapped
                    //correctly to disk. Otherwise, there is likely
                    //no path mapping for a path starting with '..'.
                    //This can still fail, but catches the most reasonable
                    //uses of ..
                    break;
                } else if (i > 0) {
                    ary.splice(i - 1, 2);
                    i -= 2;
                }
            }
        }
    }

    function normalize(name, baseName) {
        var baseParts;

        //Adjust any relative paths.
        if (name && name.charAt(0) === '.') {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                baseParts = baseName.split('/');
                baseParts = baseParts.slice(0, baseParts.length - 1);
                baseParts = baseParts.concat(name.split('/'));
                trimDots(baseParts);
                name = baseParts.join('/');
            }
        }

        return name;
    }

    /**
     * Create the normalize() function passed to a loader plugin's
     * normalize method.
     */
    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(id) {
        function load(value) {
            loaderCache[id] = value;
        }

        load.fromText = function (id, text) {
            //This one is difficult because the text can/probably uses
            //define, and any relative paths and requires should be relative
            //to that id was it would be found on disk. But this would require
            //bootstrapping a module/require fairly deeply from node core.
            //Not sure how best to go about that yet.
            throw new Error('amdefine does not implement load.fromText');
        };

        return load;
    }

    makeRequire = function (systemRequire, exports, module, relId) {
        function amdRequire(deps, callback) {
            if (typeof deps === 'string') {
                //Synchronous, single module require('')
                return stringRequire(systemRequire, exports, module, deps, relId);
            } else {
                //Array of dependencies with a callback.

                //Convert the dependencies to modules.
                deps = deps.map(function (depName) {
                    return stringRequire(systemRequire, exports, module, depName, relId);
                });

                //Wait for next tick to call back the require call.
                if (callback) {
                    process.nextTick(function () {
                        callback.apply(null, deps);
                    });
                }
            }
        }

        amdRequire.toUrl = function (filePath) {
            if (filePath.indexOf('.') === 0) {
                return normalize(filePath, path.dirname(module.filename));
            } else {
                return filePath;
            }
        };

        return amdRequire;
    };

    //Favor explicit value, passed in if the module wants to support Node 0.4.
    requireFn = requireFn || function req() {
        return module.require.apply(module, arguments);
    };

    function runFactory(id, deps, factory) {
        var r, e, m, result;

        if (id) {
            e = loaderCache[id] = {};
            m = {
                id: id,
                uri: __filename,
                exports: e
            };
            r = makeRequire(requireFn, e, m, id);
        } else {
            //Only support one define call per file
            if (alreadyCalled) {
                throw new Error('amdefine with no module ID cannot be called more than once per file.');
            }
            alreadyCalled = true;

            //Use the real variables from node
            //Use module.exports for exports, since
            //the exports in here is amdefine exports.
            e = module.exports;
            m = module;
            r = makeRequire(requireFn, e, m, module.id);
        }

        //If there are dependencies, they are strings, so need
        //to convert them to dependency values.
        if (deps) {
            deps = deps.map(function (depName) {
                return r(depName);
            });
        }

        //Call the factory with the right dependencies.
        if (typeof factory === 'function') {
            result = factory.apply(m.exports, deps);
        } else {
            result = factory;
        }

        if (result !== undefined) {
            m.exports = result;
            if (id) {
                loaderCache[id] = m.exports;
            }
        }
    }

    stringRequire = function (systemRequire, exports, module, id, relId) {
        //Split the ID by a ! so that
        var index = id.indexOf('!'),
            originalId = id,
            prefix, plugin;

        if (index === -1) {
            id = normalize(id, relId);

            //Straight module lookup. If it is one of the special dependencies,
            //deal with it, otherwise, delegate to node.
            if (id === 'require') {
                return makeRequire(systemRequire, exports, module, relId);
            } else if (id === 'exports') {
                return exports;
            } else if (id === 'module') {
                return module;
            } else if (loaderCache.hasOwnProperty(id)) {
                return loaderCache[id];
            } else if (defineCache[id]) {
                runFactory.apply(null, defineCache[id]);
                return loaderCache[id];
            } else {
                if(systemRequire) {
                    return systemRequire(originalId);
                } else {
                    throw new Error('No module with ID: ' + id);
                }
            }
        } else {
            //There is a plugin in play.
            prefix = id.substring(0, index);
            id = id.substring(index + 1, id.length);

            plugin = stringRequire(systemRequire, exports, module, prefix, relId);

            if (plugin.normalize) {
                id = plugin.normalize(id, makeNormalize(relId));
            } else {
                //Normalize the ID normally.
                id = normalize(id, relId);
            }

            if (loaderCache[id]) {
                return loaderCache[id];
            } else {
                plugin.load(id, makeRequire(systemRequire, exports, module, relId), makeLoad(id), {});

                return loaderCache[id];
            }
        }
    };

    //Create a define function specific to the module asking for amdefine.
    function define(id, deps, factory) {
        if (Array.isArray(id)) {
            factory = deps;
            deps = id;
            id = undefined;
        } else if (typeof id !== 'string') {
            factory = id;
            id = deps = undefined;
        }

        if (deps && !Array.isArray(deps)) {
            factory = deps;
            deps = undefined;
        }

        if (!deps) {
            deps = ['require', 'exports', 'module'];
        }

        //Set up properties for this module. If an ID, then use
        //internal cache. If no ID, then use the external variables
        //for this node module.
        if (id) {
            //Put the module in deep freeze until there is a
            //require call for it.
            defineCache[id] = [id, deps, factory];
        } else {
            runFactory(id, deps, factory);
        }
    }

    //define.require, which has access to all the values in the
    //cache. Useful for AMD modules that all have IDs in the file,
    //but need to finally export a value to node based on one of those
    //IDs.
    define.require = function (id) {
        if (loaderCache[id]) {
            return loaderCache[id];
        }

        if (defineCache[id]) {
            runFactory.apply(null, defineCache[id]);
            return loaderCache[id];
        }
    };

    define.amd = {};

    return define;
}

module.exports = amdefine;

}).call(this,require('_process'),"/node_modules/amdefine/amdefine.js")
},{"_process":3,"path":2}],6:[function(require,module,exports){
module.exports = function (require) {
    function alloc(options) {
        'use strict';
        var array = options.array || [], header = options.fields || array[0], types = options.types || [], struct = options.struct, skip = options.skip || 0, data = options.data || [];
        var ds = {}, parsers = [];
        if (types.length && typeof types == 'string') {
            var ta = [];
            for (var i = 0; i < header.length; i++) {
                ta.push(types);
            }
            types = ta;
        }
        if (typeof struct == 'object') {
            header = Object.keys(struct);
            types = Object.keys(struct).map(function (h) {
                return struct[h];
            });
        }
        if (typeof skip == 'number') {
            for (var j = 0; j < skip; j++)
                array.shift();
        }
        types.forEach(function (t) {
            parsers.push(getParser(t));
        });
        function getParser(type) {
            if (type == 'int' || type.match('veci*')) {
                return function (value) {
                    var res = parseInt(value);
                    return isNaN(res) ? 0 : res;
                };
            } else if (type == 'float' || type.match('vecf*')) {
                return function (value) {
                    var res = parseFloat(value);
                    return isNaN(res) ? 0 : res;
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
            data.fields = header;
            data.struct = 'rowArray';
            return data;
        };
        ds.columnArray = function () {
            header.forEach(function (k, i) {
                var column = array.map(function (a) {
                    return parsers[i](a[i]);
                });
                data.push(column);
            });
            data.fields = header;
            data.struct = 'columnArray';
            return data;
        };
        return ds;
    }
    ;
    return alloc;
}(require);
},{}],7:[function(require,module,exports){
if (typeof define !== 'function')
    var define = require('amdefine')(module);
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
        var result = vectors[0], numberOfVectors = vectors.length;
        for (var i = 1; i < numberOfVectors; i++) {
            result = array.vectorAdd(result, vectors[i]);
        }
        return result;
    };
    function _vectorAvg(a, b) {
        var c = [];
        a.forEach(function (v, i) {
            c[i] = (v + b[i]) * 0.5;
        });
        return c;
    }
    array.vectorAvg = function (vectors) {
        var result = vectors[0], numberOfVectors = vectors.length;
        for (var i = 1; i < numberOfVectors; i++) {
            result = _vectorAvg(result, vectors[i]);
        }
        return result;
    };
    return array;
}(require);
},{"amdefine":5}],8:[function(require,module,exports){
if (typeof define !== 'function')
    var define = require('amdefine')(module);
module.exports = function (require) {
    'use strict';
    function DataStruct(arg) {
        var ds = {}, array = arg.array || [], header = arg.header || arg.fields || array[0], types = arg.types || [], struct = arg.struct, skip = arg.skip || 0, parsers = [], data = arg.data || [];
        if (types.length && typeof types == 'string') {
            var ta = [];
            for (var i = 0; i < header.length; i++) {
                ta.push(types);
            }
            types = ta;
        }
        if (typeof struct == 'object') {
            header = Object.keys(struct);
            types = Object.keys(struct).map(function (h) {
                return struct[h];
            });
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
                    var res = parseInt(value);
                    return isNaN(res) ? 0 : res;
                };
            } else if (type == 'float' || type.match('vecf*')) {
                return function (value) {
                    var res = parseFloat(value);
                    return isNaN(res) ? 0 : res;
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
            data.fields = header;
            data.struct = 'rowArray';
            return data;
        };
        ds.columnArray = function () {
            header.forEach(function (k, i) {
                var column = array.map(function (a) {
                    return parsers[i](a[i]);
                });
                data.push(column);
            });
            data.fields = header;
            data.struct = 'columnArray';
            return data;
        };
        return ds;
    }
    ;
    function leftJoin(oal, oar) {
        var len = oal.length, keyL = Object.keys(oal[0]), keyR = Object.keys(oar[0]);
        var keys = keyR.filter(function (kr) {
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
},{"amdefine":5}],9:[function(require,module,exports){
var prepareWorker = function (work) {
    var content = work.toString().split('\n');
    content.pop();
    content.shift();
    var blob = new Blob([content.join('\n')], { type: 'text/javascript' });
    return window.URL.createObjectURL(blob);
};
module.exports = function (require) {
    var Transform = require('../dataopt/transform'), Derive = require('../dataopt/derive'), Queries = require('../dataopt/query');
    var pWorker = require('./worker'), aggregate = require('../dataopt/aggregate'), select = require('../dataopt/select');
    return function pipeline(data) {
        var queue = [], cache = {}, opt = {}, workers = [], completed = 0, result = [], callback = function () {
            };
        if (Array.isArray(data)) {
            result = data;
        }
        opt.transform = Transform;
        opt.derive = Derive;
        opt.select = select;
        opt.aggregate = aggregate;
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
        var finalResult = [];
        function mergeResult(workerResult) {
            var rl = finalResult.length, wl = workerResult.length;
            for (var i = 0; i < wl; i++) {
                finalResult[rl + i] = workerResult[i];
            }
            completed += 1;
            if (completed == workers.length) {
                var lastJob = queue[queue.length - 1], lastJobOpt = Object.keys(lastJob)[0];
                if (lastJobOpt == 'aggregate') {
                    finalResult = opt.aggregate(finalResult, lastJob.aggregate);
                }
                callback(finalResult);
            }
        }
        var pipeline = {};
        pipeline.workers = function (workerCount) {
            var workSize = Math.ceil(result.length / workerCount), workShares = new Array(workerCount).fill(workSize);
            workShares[workerCount - 1] -= workSize * workerCount - result.length;
            for (var i = 0; i < workerCount; i++) {
                workers[i] = new Worker(prepareWorker(pWorker));
                workers[i].addEventListener('message', function (e) {
                    if (e.data.msg == 'result') {
                        mergeResult(e.data.result);
                    }
                    ;
                }, false);
                var parts = document.location.href.split('/');
                parts.pop();
                var url = parts.join('/');
                workers[i].postMessage({
                    workerID: i,
                    cmd: 'init',
                    data: result.slice(i * workSize, i * workSize + workShares[i]),
                    url: url
                });
            }
            return pipeline;
        };
        Object.keys(opt).forEach(function (o) {
            pipeline[o] = function (spec) {
                var task = {};
                task[o] = spec;
                queue.push(task);
                return pipeline;
            };
        });
        pipeline.then = function (_callback) {
            callback = _callback;
            if (workers.length) {
                workers.forEach(function (worker, i) {
                    worker.postMessage({
                        cmd: 'exec',
                        jobs: queue
                    });
                });
            } else {
                queue.forEach(function (q) {
                    var f = Object.keys(q)[0];
                    result = opt[f](result, q[f]);
                });
            }
            return result;
        };
        pipeline.oncomplete = pipeline.then;
        pipeline.result = function () {
            return result;
        };
        pipeline.data = function (data) {
            result = data;
            return pipeline;
        };
        pipeline.queue = function () {
            return queue;
        };
        return pipeline;
    };
}(require);
},{"../dataopt/aggregate":14,"../dataopt/derive":15,"../dataopt/query":16,"../dataopt/select":17,"../dataopt/transform":19,"./worker":10}],10:[function(require,module,exports){
module.exports = function () {
    var isBrowser;
    return function () {
        if (typeof module !== 'undefined' && module.exports) {
            isBrowser = false;
            var p4 = require('../../index.js');
        } else {
            isBrowser = true;
        }
        var workerID, dataopt, data;
        function exec(arg) {
            var jobs = arg.jobs;
            jobs.forEach(function (job) {
                var opt = Object.keys(job)[0];
                var spec = job[opt];
                console.log(opt, spec);
                if (dataopt.hasOwnProperty(opt)) {
                    data = dataopt[opt](data, spec);
                }
            });
            self.postMessage({
                msg: 'result',
                workerID: workerID,
                result: data
            });
        }
        self.addEventListener('message', function (e) {
            var arg = e.data, cmd = arg.cmd || arg.msg || arg.command;
            console.log(cmd, arg);
            switch (cmd) {
            case 'init':
                workerID = arg.workerID;
                data = arg.data;
                if (isBrowser) {
                    self.importScripts(arg.url + '/p4.js');
                    dataopt = p4.dataopt;
                }
                break;
            case 'exec':
                exec(arg);
                break;
            default:
                console.log('nothing to do.');
                break;
            }
            ;
        }, false);
    };
}();
},{"../../index.js":4}],11:[function(require,module,exports){
if (typeof define !== 'function')
    var define = require('amdefine')(module);
module.exports = function (require) {
    var ctypes = require('./ctypes');
    var query = { filter: require('./filter') };
    var filter = require('./filter');
    return function ColumnStore(option) {
        'use strict';
        var cstore = this instanceof ColumnStore ? this : {}, columns = [], size = option.size || 0, count = option.count || 0, types = option.types || [], keys = option.keys || option.names || [], semantics = option.semantics || [], struct = option.struct || {}, CAMs = option.CAMs || {}, TLBs = option.TLBs || {}, colStats = {}, colAlloc = {}, colRead = {};
        if (option.struct)
            initStruct(option.struct);
        function initCStore() {
            if (size && types.length === keys.length && types.length > 0) {
                keys.forEach(function (c, i) {
                    configureColumn(i);
                    columns[i] = new colAlloc[c](size);
                    if (!columns.hasOwnProperty(c))
                        Object.defineProperty(columns, c, {
                            get: function () {
                                return columns[i];
                            }
                        });
                });
                columns.keys = keys;
                columns.types = types;
                columns.struct = struct;
                columns.TLBs = TLBs;
                columns.CAMs = CAMs;
                columns.size = size;
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
                    return parseInt(value) || 0;
                };
            } else if (colAlloc[f] === ctypes.float || colAlloc[f] === ctypes.double) {
                colRead[f] = function (value) {
                    return parseFloat(value) || 0;
                };
            } else {
                throw new Error('Invalid data type for TypedArray data!');
            }
        }
        cstore.addRows = function (rowArray) {
            rowArray.forEach(function (row) {
                row.forEach(function (v, j) {
                    if (j < columns.length)
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
                Object.defineProperty(columns, columnName, {
                    get: function () {
                        return columns[cid];
                    }
                });
            }
            if (columnArray instanceof ctypes[types[cid]]) {
                columns[cid] = columnArray;
            } else if (ArrayBuffer.isView(columnArray)) {
                columns[cid] = new colAlloc[columnName](columnArray);
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
                names: keys,
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
                    colStats[name] = {
                        min: min,
                        max: max,
                        avg: avg
                    };
                }
            });
            return colStats;
        };
        cstore.domains = function (col) {
            var col = col || keys, domains = [];
            col.forEach(function (name, c) {
                domains[name] = [
                    colStats[name].min,
                    colStats[name].max
                ];
            });
            return domains;
        };
        cstore.ctypes = function () {
            return ctypes;
        };
        cstore.size = size;
        cstore.filter = function (spec) {
            columns = filter(columns, spec);
            count = size = columns.rows;
            return cstore;
        };
        return initCStore();
    };
}(require);
},{"./ctypes":12,"./filter":13,"amdefine":5}],12:[function(require,module,exports){
if (typeof define !== 'function')
    var define = require('amdefine')(module);
module.exports = function () {
    return {
        int: Int32Array,
        short: Int16Array,
        float: Float32Array,
        double: Float64Array,
        string: Uint8Array,
        time: Int32Array
    };
}();
},{"amdefine":5}],13:[function(require,module,exports){
if (typeof define !== 'function')
    var define = require('amdefine')(module);
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
},{"../core/arrays":7,"amdefine":5}],14:[function(require,module,exports){
module.exports = function (require) {
    var ArrayOpts = require('../core/arrays.js');
    return function (data, spec, headers) {
        var i, l = data.length, attributes = headers || Object.keys(data[0]), keys = Object.keys(spec), bin, bins = [], binCollection = {}, result = [], ks;
        if (keys.indexOf('$group') < 0)
            return result;
        for (i = 0; i < l; i++) {
            if (spec.$group instanceof Array) {
                ks = [];
                spec.$group.forEach(function (si) {
                    ks.push(data[i][si]);
                });
                bin = JSON.stringify(ks);
            } else {
                bin = data[i][spec.$group];
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
            if (spec.$group instanceof Array) {
                ks = JSON.parse(bins[i]);
                spec.$group.forEach(function (s, j) {
                    res[s] = ks[j];
                });
            } else {
                res[spec.$group] = bins[i];
            }
            if (spec.$data) {
                res.data = binCollection[bins[i]];
            }
            keys.forEach(function (key) {
                if (key == '$group' || key == '$data')
                    return;
                var attr, opt = spec[key];
                if (attributes.indexOf(key) !== -1 || opt === '$count') {
                    attr = key;
                } else {
                    opt = Object.keys(spec[key])[0];
                    attr = spec[key][opt];
                    if (attributes.indexOf(attr) === -1) {
                        var warnMsg = 'No matching attribute or operation defined for the new attribute ' + key + ':' + spec[key];
                        console.warn(warnMsg);
                        return;
                    }
                }
                if (typeof opt === 'function') {
                    res[key] = opt.call(null, binCollection[bins[i]].map(function (a) {
                        return a[attr];
                    }));
                } else if (typeof opt === 'string') {
                    if (opt === '$unique') {
                        res[key] = ArrayOpts.unique(binCollection[bins[i]].map(function (a) {
                            return a[key];
                        }));
                    } else if (opt === '$list') {
                        res[key] = binCollection[bins[i]].map(function (a) {
                            return a[attr];
                        });
                    } else if (opt === '$first') {
                        res[key] = binCollection[bins[i]][0][attr];
                    } else if (opt === '$merge') {
                        var mergedResult = [];
                        binCollection[bins[i]].map(function (a) {
                            return a[attr];
                        }).forEach(function (m) {
                            mergedResult = mergedResult.concat(m);
                        });
                        res[key] = mergedResult;
                    } else if (opt === '$count') {
                        res[key] = binCollection[bins[i]].length;
                    } else if (opt === '$data') {
                        res[key] = binCollection[bins[i]];
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
}(require);
},{"../core/arrays.js":7}],15:[function(require,module,exports){
module.exports = function Derive(require) {
    'use strict';
    var $ = require('../core/arrays.js');
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
},{"../core/arrays.js":7}],16:[function(require,module,exports){
if (typeof define !== 'function')
    var define = require('amdefine')(module);
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
                            match = obj[key] >= spec[key][opt][0] & obj[index] <= spec[key][opt][1];
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
                    attr = Object.keys(spec[key])[0];
                    opt = spec[key][attr];
                    if (attributes.indexOf(attr) === -1) {
                        var warnMsg = 'No matching attribute or operation defined for the new attribute ' + key + ':' + spec[key];
                        console.warn(warnMsg);
                        return;
                    }
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
                    } else if (opt === '$first') {
                        res[key] = binCollection[bins[i]][0][attr];
                    } else if (opt === '$mergeArray') {
                        var mergedResult = [];
                        binCollection[bins[i]].map(function (a) {
                            return a[attr];
                        }).forEach(function (m) {
                            mergedResult = mergedResult.concat(m);
                        });
                        res[key] = mergedResult;
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
            bins[b].data = [];
        }
        for (var i = 0; i < l; i++) {
            binID = Math.floor((array[i] - min) / range * numBin);
            if (binID == numBin)
                binID--;
            data[i].binID = binID;
            bins[binID].data.push(data[i]);
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
    query.partitionBy = function (data, spec) {
        var len = data.length, pid, partitions = [], key = Object.keys(spec)[0], parts = spec[key];
        parts.forEach(function (b, bi) {
            partitions[bi] = {
                partition: bi,
                data: [],
                count: 0,
                name: b
            };
        });
        for (var i = 0; i < len; i++) {
            pid = parts.indexOf(data[i][key]);
            if (pid > -1) {
                partitions[pid].data.push(data[i]);
                partitions[pid].count++;
            }
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
    query.toColumnArray = function (data) {
        var columnArray = [];
        attributes = Object.keys(data[0]).filter(function (k) {
            return k;
        });
        attributes.forEach(function (attr) {
            columnArray.push(data.map(function (d) {
                return d[attr];
            }));
        });
        columnArray.fields = attributes;
        attributes.forEach(function (attr, ai) {
            columnArray[attr] = columnArray[ai];
        });
        return columnArray;
    };
    return query;
}(require);
},{"../core/arrays.js":7,"amdefine":5}],17:[function(require,module,exports){
module.exports = function select(require) {
    var ArrayOpts = require('../core/arrays.js');
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
                            match = obj[key] >= spec[key][opt][0] & obj[index] <= spec[key][opt][1];
                        } else if (opt == '$ninRange') {
                            match = obj[key] < spec[key][opt][0] | obj[index] > spec[key][opt][1];
                        } else if (opt == '$inDate') {
                            match = spec[key][opt].map(Number).indexOf(+obj[index]) > -1;
                        }
                    }
                } else if (Array.isArray(spec[key])) {
                    match = obj[key] >= spec[key][0] & obj[index] <= spec[key][1];
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
    return function (data, spec) {
        var indexes = data[0];
        if (!Array.isArray(indexes))
            indexes = [];
        return data.filter(function (a) {
            if (_match(a, spec, indexes))
                return a;
        });
    };
}(require);
},{"../core/arrays.js":7}],18:[function(require,module,exports){
module.exports = function (require) {
    'use strict';
    var opt = require('../core/arrays');
    function stats(data, fields) {
        if (!Array.isArray(data))
            throw new Error('Inproper input data format.');
        var result = {};
        fields.forEach(function (f) {
            var a = data.map(function (d) {
                return d[f];
            });
            result[f] = {
                min: opt.min(a),
                max: opt.max(a),
                avg: opt.avg(a),
                std: opt.std(a)
            };
        });
        return result;
    }
    ;
    stats.domains = function (data, fields) {
        if (!Array.isArray(data))
            throw new Error('Inproper input data format.');
        var result = {};
        fields.forEach(function (f) {
            var a = data.map(function (d) {
                return d[f];
            });
            result[f] = [
                opt.min(a),
                opt.max(a)
            ];
        });
        return result;
    };
    return stats;
}(require);
},{"../core/arrays":7}],19:[function(require,module,exports){
if (typeof define !== 'function')
    var define = require('amdefine')(module);
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
},{"amdefine":5}],20:[function(require,module,exports){
if (typeof define !== 'function')
    var define = require('amdefine')(module);
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
},{"amdefine":5}],21:[function(require,module,exports){
if (typeof define !== 'function')
    var define = require('amdefine')(module);
module.exports = function nodeDSV(require) {
    'use strict';
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
        var filepath = option.filepath, bufferSize = option.bufferSize || option.chunkSize || 32 * 1024, textEncoding = option.textEncoding || 'utf-8', delimiter = option.delimiter || ',', onopen = option.onopen || onFileOpen, onload = option.onload || onChunkLoad, oncomplete = option.oncomplete || onComplete;
        metadata.types = option.types;
        metadata.header = option.header;
        skipRow = option.skip || 0;
        function createReadStream() {
            return fs.createReadStream(filepath, {
                flags: 'r',
                fd: null,
                mode: '0644',
                encoding: textEncoding,
                bufferSize: bufferSize,
                autoClose: true
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
},{"amdefine":5,"fs":1}],22:[function(require,module,exports){
if (typeof define !== 'function')
    var define = require('amdefine')(module);
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
function parseLargeDSV(text, delimiter) {
    var size = text.length, accum = 0, i, row, rows = [], fields = [], lens = [], EOL = false;
    while (accum < size) {
        i = accum, EOL = false;
        row = loadLine(text, delimiter, i + 2);
        fields = row.split(delimiter);
        fileds.forEach(function (field, j) {
            lens[j] = field.length;
        });
        rows.push(fields);
    }
    return rows;
}
function loadLine(text, delimiterCode, initPos) {
    var EOL = false, QUOTE = false, c = initPos, code, f = initPos, q, fields = [], L = text.length;
    while (!EOL) {
        code = text.charCodeAt(c);
        if (code === 10 || c >= L) {
            EOL = true;
            fields.push(text.slice(f, c));
        } else {
            if (code === delimiterCode && !QUOTE) {
                var field = text.slice(f, c);
                fields.push(field);
                f = c + 1;
            } else if (code === 34) {
                if (QUOTE) {
                    if (text.charCodeAt(c + 1) === delimiterCode) {
                        QUOTE = false;
                        fields.push(text.slice(q, c));
                        f = c + 2;
                        c++;
                    }
                } else {
                    q = c + 1;
                    QUOTE = true;
                }
            }
        }
        c++;
    }
    return {
        fields: fields,
        parsedLength: c - initPos
    };
}
},{"amdefine":5}],23:[function(require,module,exports){
if (typeof define !== 'function')
    var define = require('amdefine')(module);
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
},{"../core/arrays.js":7,"amdefine":5}],24:[function(require,module,exports){
module.exports = function (require) {
    'use strict';
    function dist(d) {
        var r, d = d || 0, rand = Math.random;
        switch (d) {
        case 1:
            r = 0.3333 * (rand() + rand() + rand());
            break;
        case 2:
            r = Math.min(rand(), rand(), rand());
            break;
        case 3:
            r = Math.max(rand(), rand(), rand());
            break;
        case 4:
            r = rand() - rand() + rand() - rand();
            r += r < 0 ? 4 : 0;
            r *= 0.25;
            break;
        default:
            r = rand();
            break;
        }
        return r;
    }
    return function rand(d) {
        return function (min, max) {
            var min = min || 0, max = max || 1;
            return min + (max - min) * dist(d);
        };
    };
}(require);
},{}],25:[function(require,module,exports){
(function (global){
var root = typeof self == 'object' && self.self === self && self ||
           typeof global == 'object' && global.global === global && global ||
           this;

// root.define = require('amdefine/intercept');
root.p4 = {
    arrays      : require("../core/arrays"),
    pipeline    : require("../core/pipeline"),
    datastruct  : require('../core/datastruct'),
    alloc       : require('../core/alloc'),

    cstore      : require("../cquery/cstore"),

    dataopt: {
        aggregate: require('../dataopt/aggregate'),
        stats   : require("../dataopt/stats"),
        select  : require("../dataopt/select")
    },

    io: {
        ajax        : require("../io/ajax"),
        csv         : require("../io/node-dsv"),
        printformat : require("../io/printformat"),
        parser      : require("../io/parser")
    },

    rand      : require('../util/rand')
};

if(typeof module != 'undefined')
    module.exports = root.p4;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../core/alloc":6,"../core/arrays":7,"../core/datastruct":8,"../core/pipeline":9,"../cquery/cstore":11,"../dataopt/aggregate":14,"../dataopt/select":17,"../dataopt/stats":18,"../io/ajax":20,"../io/node-dsv":21,"../io/parser":22,"../io/printformat":23,"../util/rand":24}]},{},[25]);
