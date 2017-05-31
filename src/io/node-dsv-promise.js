if (typeof(define) !== 'function') var define = require('amdefine')(module);

define(function nodeDSV(require){
    "use strict;"
    var dsv = {},
        fs = require('fs');

    dsv.read = function(option){
        var rowArray = [],
            metadata = {},
            skipRow = 0;

        function onChunkLoad(rows) {
            rowArray = rowArray.concat(rows);
        }

        var filepath = option.filepath,
            bufferSize = option.bufferSize || option.chunkSize || 8 * 1024,
            textEncoding = option.textEncoding || 'utf-8',
            delimiter = option.delimiter || ",",
            onopen = option.onopen || function(){},
            onload = option.onload || onChunkLoad;

        metadata.types = option.types;
        metadata.header = option.header;
        skipRow = option.skip || 0;

        function createReadStream() {
            return fs.createReadStream(filepath, {
                flags: 'r',
                fd: null,
                mode: 0666,
                encoding: textEncoding,
                bufferSize: bufferSize
            });
        }

        function getLineCount() {
            var stream = createReadStream(),
                lineCount = 0;

            return new Promise(function(resolve, reject) {
                stream.on('data', function(data){
                    for(var i=0, l=data.length; i<l; i++)
                        if(data.charCodeAt(i) === 10) lineCount++;
                });

                stream.on('error', function(){
                    reject(Error("Error during reading file."));
                });

                stream.on('end', function(){
                    resolve(lineCount);
                });
            });
        }

        function loadDSV(delimiter, onChunk) {
            var stream = createReadStream(),
                leftOver = "";

            return new Promise(function(resolve, reject) {
                stream.on('data', function(data){
                    var loaded = 0,
                        rows = [];

                    data = leftOver + data;   //prepend leftover from previous chunk
                    rows = data.split('\n');

                    leftOver = rows.pop();   //get leftover from current chunk (if any)
                    rows = rows.map(function(r){
                        return r.split(delimiter);
                    });
                    onChunk(rows);
                });

                stream.on('error', function(){
                    reject(Error("Error during reading file."));
                });

                stream.on('end', function(){
                    if(leftOver.length) { //load last chunk if any
                        onChunk([leftOver.split(delimiter)]);
                    }
                    resolve(rowArray);
                });
            });
        }

        var countLine,
            loadText;

        countLine = getLineCount();
        loadFile = countLine.then(function(numRow){
            metadata.rowTotal = numRow;
            onopen(metadata);
            return loadDSV(delimiter, onload);
        });

        return Promise.all([countLine, loadFile]);
    }

    dsv.readAll = function(options) {
        var promises = [];
        options.forEach(function(option){
            promises.push(
                dsv.read(option)
                .then(function(result){
                    // Because dsv.read has nested Promises with the first
                    // promise return the number of line in the file and the
                    // second promise return the actual content.
                    // For dsv.readAll, only the actual contents of multiple
                    // reads are returned in the final combined result(an array),
                    // the numbers of lines are not included in the result.
                    return new Promise(function(resolve, reject) {
                        resolve(result[1]);
                    });
                })
            );
        });

        return Promise.all(promises);
    }

    return dsv;
});
