/**
 * @param {int} position
 * @param {int} length
 * @return {number[]}
 */
function createOneHotEncoding(position, length) {
    const oneHotEncoding = new Array(length).fill(0);
    oneHotEncoding[position] = 1;
    return oneHotEncoding;
}

module.exports = {
    createOneHotEncoding,
};
