define(function(){
    return function project(data, fields){
        return data.map(function(d){
            var item = {};
            fields.forEach(function(f){
                item[f] = d[f];
            });
            return item;
        });
    }
});
