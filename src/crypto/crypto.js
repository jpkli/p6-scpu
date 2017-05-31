module.exports = function Crypto(secret) {
    var crypto = {},
        f = {},
        secret = secret || null;
        enc = require("crypto-js/enc-utf8");

    f = {
        //hashings
        $md5    : require('crypto-js/md5'),
        $sha1   : require('crypto-js/sha1'),
        $sha3   : require('crypto-js/sha3'),
        $sha256 : require('crypto-js/sha256'),
        $sha512 : require('crypto-js/sha512'),
        $sha384 : require('crypto-js/sha384'),
        $sha224 : require('crypto-js/sha224'),

        //encryptions
        $aes        : require('crypto-js/aes'),
        $tripleDES  : require('crypto-js/tripledes'),
        $rc4        : require('crypto-js/rc4'),
        $rabbit     : require('crypto-js/rabbit'),
        $evpkdf     : require('crypto-js/evpkdf'),

        //secret-sharing
        $shamir : require('./shamir.js')
    }

    crypto.keygen = function(len) {
        var passphrase = "",
            l = len || 128;
        for(var i = 0; i < l; i++){
            passphrase += String.fromCharCode(Math.floor(Math.random()*128)+32);
        }
        return passphrase;
    };

    if(secret === null) secret = crypto.keygen(64);

    crypto.encrypt = function(data, spec) {
        for(var i = 0, l = data.length; i < l; i++) {
            Object.keys(spec).forEach(function(k) {
                if(spec[k] in f) {
                    var input = (typeof data[i][k] == "object") ? JSON.stringify(data[i][k]) : data[i][k];

                    if(typeof f[spec[k]].encrypt == "function") {
                        data[i][k] = f[spec[k]].encrypt(input, secret).toString();
                    } else {
                        data[i][k] = f[spec[k]](input).toString();
                    }
                } else {
                    throw new Error("No such operation: " + spec[g]);
                }
            });
        }
    };

    crypto.decrypt = function(data, spec) {
        for(var i = 0, l = data.length; i < l; i++) {
            Object.keys(spec).forEach(function(k) {
                var bytes;
                if(spec[k] in f) {
                    bytes = f[spec[k]].decrypt(data[i][k], secret);
                    data[i][k] = bytes.toString(enc);
                }
            });
        }
    };

    return crypto;
}
