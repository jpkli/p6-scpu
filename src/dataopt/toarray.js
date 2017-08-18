define(function(){
    return function toArray(data, arg){
        var options = arg || {},
            fields = options.fields || Object.keys(data[0]) || [],
            format = options.format || 'row';

        if(format == 'row') {
            return data.map(function(d){
                var row = new Array(fields.length);
                fields.forEach(function(f, i){
                    row[i] = d[f];
                });
                return row;
            });
        } else {
            return fields.map(function(f){
                return data.map(function(d){ return d[f]; })
            })
        }
    }
});
