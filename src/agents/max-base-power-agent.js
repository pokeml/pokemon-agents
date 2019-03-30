'use strict';

const TeamAwareAgent = require('../core/team-aware-agent');

/**
 * An agent that chooses actions uniformly at random.
 */
class MaxBasePowerAgent extends TeamAwareAgent {
    /**
     * @override
     */
    act(actionSpace, observation, reward, done) {
        super.updateState(observation);
        super.act(actionSpace, observation, reward, done);

        // simulatedBattle object is only instantiated after team preview
        if (this.simulatedBattle === null) {
            return this._sample(actionSpace);
        }
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
