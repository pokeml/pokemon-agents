'use strict';

/**
 * A base class for all agents.
 */
class Agent {
    /**
     * Choose an action.
     *
     * @param {Array} actionSpace
     * @param {String} observation
     * @param {number} reward
     * @param {boolean} done
     */
    act(actionSpace, observation, reward, done) {
        throw new Error('Must be implemented by subclass.');
    }

    /**
     * Reset the agent.
     */
    reset() {
        throw new Error('Must be implemented by subclass');
    }
}

module.exports = Agent;
