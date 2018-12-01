'use strict';

const RandomAgent = require('./random-agent');

/**
 * An agent that chooses actions uniformly at random, with a preference for moves over switches,
 * and mega evolution when possible.
 */
class SemiRandomAgent extends RandomAgent {
    /**
     * @param {number} [seed]
     */
    constructor(seed = null) {
        super(seed);
    }

    /**
     * Behavior:
     *  - If mega evolution is possible, do it.
     *  - If move actions are available, randomly choose one of them.
     *  - Otherwise, pick a random available action.
     *
     * @override
     */
    act(actionSpace, observation, reward, done) {
        const megaActions = actionSpace.filter((action) => action.mega);
        if (megaActions.length > 0) {
            return this._sample(megaActions);
        }

        const moveActions = actionSpace.filter((action) => action.type === 'move');
        if (moveActions.length > 0) {
            return this._sample(moveActions);
        }

        return this._sample(actionSpace);
    }
}

module.exports = SemiRandomAgent;
