'use strict';

const TeamAwareTrackingAgent = require('../core/team-aware-tracking-agent');

/**
 * An agent that chooses actions uniformly at random.
 */
class MaxBasePowerAgent extends TeamAwareTrackingAgent {
    /**
     * @override
     */
    act(actionSpace, observation, reward, done) {
        super.update(observation);
        let maxBasePower = -1;
        let maxBasePowerIndex = 0;
        const moves = this.getCurrentMoves();
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].basePower > maxBasePower) {
                maxBasePower = moves[i].basePower;
                maxBasePowerIndex = i;
            }
        }
        if (typeof actionSpace[maxBasePowerIndex] != undefined) {
            return actionSpace[maxBasePowerIndex];
        }
        return this._sample(actionSpace);
    }
}

module.exports = MaxBasePowerAgent;
