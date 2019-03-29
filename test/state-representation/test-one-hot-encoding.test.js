const encoding = require('../../src/encoding/one-hot-encoding');


test('test one hot encoding', () => {
    expect(encoding.createOneHotEncoding(3, 5)).toEqual([0, 0, 0, 1, 0]);
});
