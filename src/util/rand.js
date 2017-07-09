define(function(require){
    'use strict';
    function dist(d) {
        var r,
            d = d || 0,
            rand = Math.random;

        switch(d) {
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
                r=rand() - rand() + rand() - rand();
                r += (r<0.0) ? 4.0 : 0.0;
                r *= 0.25;
                break;
            default:
                r = rand();
                break;
        }

        return r;

    }

    return function rand(d){
        return function(min, max) {
            var min = min || 0,
                max = max || 1;

            return min + (max - min) * dist(d);
        }
    }
});
