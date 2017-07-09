const p4 = require('../../index.js');
const assert = require('chai').assert;
const _ = require('lodash');
var data = [
    {age: 20, height: 160, weight: 129},
    {age: 21, height: 180, weight: 160},
    {age: 22, height: 170, weight: 152},
    {age: 23, height: 168, weight: 160}
];

var r = _.chain(data)
        .filter({'weight': 160})
        .groupBy('weight')
        .map((value, key) => ({
            weight: key,
            total: _.sumBy(value, 'weight')
        }))
        .value();

console.log(r);

var select = p4.pipeline().select({
    weight: 160
})

describe('Select', () => {
    describe('multiple conditions', () => {
        var select = p4.pipeline().select({
            weight: 160,
            height: 180
        });
        it('should return rows with all -1 when the value is not present', () => {
            assert.deepEqual([{ age: 21, height: 180, weight: 160 }], select(data));
        });
    });
});
