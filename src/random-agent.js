'use strict';

const _ = require('underscore');

/**
 * An agent that chooses actions uniformly at random.
 */
class RandomAgent {
    /**
     * Choose an action.
     *
     * @param {State} state
     * @param {Action[]} actions
     * @return {string}
     */
    act(state, actions) {
        return _.sample(actions);
    }
}

module.exports = RandomAgent;
