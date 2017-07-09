define(function(require){
    function join(dataLeft, dataRight) {
        'use strict';
        var len = dataLeft.length,
            keyL = Object.keys(dataLeft[0]),
            keyR = Object.keys(dataRight[0]);


        var keys = keyR.filter(function(kr){ return (keyL.indexOf(kr) === -1);});

        for(var i = 0; i < len; i++) {
            keys.forEach(function(k){
                dataLeft[i][k] = dataRight[i][k];
            });
        }

        return dataLeft;
    }

    return join;
})
