var a = [];

for(var i = 0; i < 10000000; i++) {
    a[i] = i * 2;
}
// var ta = new Float32Array(a);
var start = new Date()
for(var i = 1; i < 8000000; i++) {
    a[i] = a[i] * 2.34 + a[i-1];
}



console.log(new Date() - start);
