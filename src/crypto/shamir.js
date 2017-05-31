module.exports = function Shamir(){

    var shamir = {},
        prime = 16777259;
        // prime = 1125899906842679;

    function _isPrime(n) {
        if (n < 2) return false;

        var q = Math.floor(Math.sqrt(n));
        for (var i = 2; i <= q; i++){
            if (n % i == 0)
                return false;
        }
        return true;
    }

    function modSub(a, b) {
        var diff = a % prime - b % prime;

        if(diff<0)
            diff += prime;

        return diff;
    }

    // function modInverse(k) {
    //     k = k % prime;
    //     for(var x = 1; x < prime; x++) {
    //         if( (k*x) % prime == 1) return x;
    //     }
    //     return 0;
    // }

    /* Gives the multiplicative inverse of k mod prime.  In other words (k * modInverse(k)) % prime = 1 for all prime > k >= 1  */
    function modInverse(k) {
        k = k % prime;
        var r = (k < 0) ? -gcdD(prime,-k)[2] : gcdD(prime,k)[2];
        return (prime + r) % prime;
    }

    function gcdD(a,b) {
        if (b == 0) return [a, 1, 0];
        else {
            var n = Math.floor(a/b), c = a % b, r = gcdD(b,c);
            return [r[0], r[2], r[1]-r[2]*n];
        }
    }

    shamir.encrypt = function(s, n, k) {
        var i, j,
            p = prime,
            a = [s],
            di,
            // x = [], y=[],
            d = [];
        // while(!_isPrime(p)) p++;
        // prime = p;
        for(i = 0; i < k - 1; i++) {
            a.push(Math.floor(Math.random() * p));
        }

        for(i = 0; i < n; i++){
            di = 0;
            for(j = 0; j < k ; j++){
                di += (a[j] * Math.pow(i+1, j)%p)%p;
            }
            // x.push(i+1);
            // y.push(di);
            d.push([i+1, di%p]);
        }

        return d;
        // return {x: x, y: y};
    }

    shamir.reconstruct = function(s) {
        var d, i, j, num, den,
            k = s.length,
            x = s.map(function(a){ return a[0];}),
            y = s.map(function(a){ return a[1];});

        for (d = 1; d < k; d++) {
            for (i = 0; i < k - d; i++) {
                j = i + d;
                num = modSub( (x[j] * y[i]) % prime,  (x[i] * y[i+1]) % prime ) ;
                den = modSub(x[j], x[i]) ;
                y[i] = (num * modInverse(den)) % prime;
            }
        }

        return y[0];
    }
}

// function reconstruct (s) {
//     var d, i, j, num, den,
//         k = s.length,
//         x = s.map(function(a){ return a[0];}),
//         y = s.map(function(a){ return a[1];}),
//         accum = 0;
//
//     for (d = 1; d < k; d++) {
//         num = den = 1;
//         for (i = 0; i < k - d; i++) {
//             j = i + d;
//             num = (num * ( (x[j] * y[i]) % prime - (x[i] * y[i+1]) % prime ) % prime) % prime ;
//             den = (den * (x[j] - x[i]) % prime) % prime;
//             // if(num<0) console.log( "debug:", x[j], y[i], x[i], y[i+1], x, y)
//
//             // y[i] = (num * modInverse(den)) % prime;
//             // console.log(y);
//         }
//
//         accum = (prime + y[i] + ( num * modInverse(den))) % prime
//     }
//
//     return accum;
// }

// function reconstruct (n, x, y) {
//     var d,i,j, num, den;
//     for (d = 1; d < n; d++) {
//         for (i = 0; i < n - d; i++) {
//             j = i + d;
//             num = ( (x[j] * y[i]) % prime - (x[i]*y[i+1])%prime );
//             den = (x[j] - x[i]);
//             y[i] = (num * modInverse(den)) % prime;
//         }
//     }
//     return y[0];
// }
