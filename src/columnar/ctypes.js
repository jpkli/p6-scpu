define(function(){
    var ctypes = {
        string : Uint8Array,
        float  : Float32Array,
        double : Float64Array,
        short  : Int16Array,
        int    : Int32Array,
        int8   : Int8Array,
        int16  : Int16Array,
        int32  : Int32Array
    }
    return ctypes;
});
