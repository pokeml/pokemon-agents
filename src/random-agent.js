'use strict';

const seedrandom = require('seedrandom');

/**
 * An agent that chooses actions uniformly at random.
 */
class RandomAgent {
    /**
     * @param {number} [seed]
     */
    constructor(seed = null) {
        this.seed = seed;
        this.random = seedrandom(seed);
    }

    /**
     * Choose an action.
     *
     * @param {State} state
     * @param {Action[]} actions
     * @return {string}
     */
    act(state, actions) {
        return this._sample(actions);
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
