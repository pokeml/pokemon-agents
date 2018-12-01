'use strict';

const _ = require('underscore');
const SmartAgent = require('../core/smart-agent');

/**
 * An agent that chooses actions uniformly at random.
 */
class SimpleAgent extends SmartAgent {
    /**
     * @override
     */
    act(actionSpace, observation, reward, done) {
        super.update(observation);
        return _.sample(actionSpace);
    }

    /**
     * @override
     */
    get state() {
        const state = super.state;

        // const myActive = state.mySide.active[0]

        return state;
    }
}

module.exports = SimpleAgent;
