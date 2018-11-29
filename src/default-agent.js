'use strict';

/**
 * An agent that always chooses the default action.
 */
class DefaultAgent {
    /**
     * Choose an action.
     *
     * @param {State} state
     * @param {Action[]} actions
     * @return {string}
     */
    act(state, actions) {
        return {'choice': 'default'};
    }
}

module.exports = DefaultAgent;
