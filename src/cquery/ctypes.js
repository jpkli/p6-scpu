if (typeof(define) !== 'function') var define = require('amdefine')(module);
define(function(){
    return {
        int    : Int32Array,
        short  : Int16Array,
        float  : Float32Array,
        double : Float64Array,
        string : Uint8Array,
        time   : Int32Array
    }
});
