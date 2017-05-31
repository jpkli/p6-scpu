if (typeof(define) !== 'function') var define = require('amdefine')(module);

define(function(require){
    "use strict";
    return function parseDSV(text, delimiter){
        var a = [],
            lines = text.split('\n');

        if(lines[lines.length-1].split(delimiter) < 2) lines.pop();//remove EOF

        lines.forEach(function(line) {
            a.push(loadLine(line, delimiter.charCodeAt(0), 0).fields);
        });
        return a;
    }
});

function parseLargeDSV(text, delimiter) {
    var size = text.length,
        accum = 0,
        i, //index for starting of a line
        row,
        rows = [],
        fields = [],
        lens = [],
        EOL = false;

    while(accum < size) {
        i = accum, EOL = false;
        row = loadLine(text, delimiter, i+2);
        fields = row.split(delimiter);

        fileds.forEach(function(field, j){
            lens[j] = field.length;
        });
        rows.push(fields);
    }
    return rows;
}

function loadLine(text, delimiterCode, initPos) {
    // if(typeof(initPos) === 'undefined') initPos = 0;
    var EOL = false,
        QUOTE = false,
        c = initPos, //current pos
        code, //code at c
        f = initPos, // start pos of current field
        q, //start pos of quote
        fields = [],
        L = text.length;

    while(!EOL){
        code = text.charCodeAt(c);
        if(code === 10 || c>=L){
            EOL = true;
            // if(text.charCodeAt(c+1) === 13) ++c;
            fields.push( text.slice(f, c) );
        } else {
            if(code === delimiterCode && !QUOTE) {
                // console.log(f,c, text.slice(f, c));
                var field = text.slice(f, c);
                fields.push( field );
                f = c+1;
            } else if(code === 34){
                if(QUOTE){
                    if(text.charCodeAt(c+1) === delimiterCode){
                        QUOTE = false;
                        fields.push(text.slice(q, c));
                        f = c+2;
                        c++;
                    }
                } else {
                    q = c+1;
                    QUOTE = true;
                }
            }
        }
        c++;
    }
    return { fields: fields, parsedLength: c-initPos };
}
