'use strict';

const seedrandom = require('seedrandom');
const Agent = require('../base/agent');

/**
 * An agent that chooses actions uniformly at random.
 */
class RandomAgent extends Agent {
    /**
     * @param {number} [seed]
     */
    constructor(seed = null) {
        super();
        this.seed = seed;
        this.random = seedrandom(seed);
    }

    /**
     * @override
     */
    act(actionSpace, observation, reward, done) {
        return this._sample(actionSpace);
    }

    /**
     * @override
     */
    reset() {
        this.random = seedrandom(this.seed);
    }

    /**
     * Sample a random element from an array.
     *
     * @param {Array} arr
     * @return {Object}
     */
    _sample(arr) {
        return arr[Math.floor(this.random() * arr.length)];
    }
}

module.exports = RandomAgent;
