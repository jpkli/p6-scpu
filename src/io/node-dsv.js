if (typeof(define) !== 'function') var define = require('amdefine')(module);

define(function nodeDSV(require){
    "use strict";
    var dsv = {},
        fs = require('fs');

    dsv.read = function(option){
        var rowArray = [],
            metadata = {},
            skipRow = 0;

        function onFileOpen() {

        }

        function onChunkLoad(rows) {
            rowArray = rowArray.concat(rows);
        }

        function onComplete() {

        }

        var filepath = option.filepath,
            bufferSize = option.bufferSize || option.chunkSize || 32 * 1024,
            textEncoding = option.textEncoding || 'utf-8',
            delimiter = option.delimiter || ",",
            onopen = option.onopen || onFileOpen,
            onload = option.onload || onChunkLoad,
            oncomplete = option.oncomplete || onComplete;

        metadata.types = option.types;
        metadata.header = option.header;
        skipRow = option.skip || 0;
        // TODO: implement skipRow
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
            var stream = createReadStream(),
                lineCount = 0;

            stream.on('data', function(data){
                for(var i=0, l=data.length; i<l; i++)
                    if(data.charCodeAt(i) === 10) lineCount++;
            });

            stream.on('error', function(){
                throw Error("Error during reading file.");
            });

            stream.on('end', function(){
                callback(lineCount);
            });
        }

        function loadCSV(delimiter, onChunk, onComplete) {
            var stream = createReadStream(),
                leftOver = "";

            stream.on('data', function(data){
                var loaded = 0,
                    rows = [];

                data = leftOver + data;   //prepend leftover from previous chunk
                rows = data.split('\n');

                while(skipRow > 0) {
                    rows.shift();
                    skipRow--;
                }

                leftOver = rows.pop();   //get leftover from current chunk (if any)
                rows = rows.map(function(r){
                    return r.split(delimiter);
                });
                onChunk(rows);
            });

            stream.on('error', function(){
                throw Error("Error during reading file.");
            });

            stream.on('end', function(){
                if(leftOver.length) { //load last chunk if any
                    onChunk([leftOver.split(delimiter)]);
                }
                onComplete(rowArray);
            });
        }

        return getLineCount(function(numRow){
            // metadata.rowTotal = numRow;
            onopen(numRow);
            loadCSV(delimiter, onload, oncomplete);
        });
    }

    return dsv;
});
