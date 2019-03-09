'use strict';

const _ = require('underscore');
const TrackingAgent = require('../core/tracking-agent');
const BattleDex = require('../tracking/battle-dex');

/**
 * An agent that chooses actions uniformly at random.
 */
class MaxBasePowerAgent extends TrackingAgent {

    /**
     * @param {'p1' | 'p2'} id
     * @param {object} team
     * @param {boolean} [debug]
     */
    constructor(id, team, debug = false) {
        super(id, debug);
        this.team = team;
    }

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

    /**
     * @return {Array}
     */
    getCurrentMoves() {
        if (this.getOwnSide().active[0] == null) {
            return [];
        }
        const activePokemonSpecies = this.getOwnSide().active[0].species;
        for (let i = 0; i < this.team.length; i++) {
            if (this.team[i].species == activePokemonSpecies) {
                const moves = [];
                for (let j = 0; j < this.team[i].moves.length; j++) {
                    moves[j] = BattleDex.getMove(this.team[i].moves[j]);
                }
                return moves;
            }
        }
        return [];
    }
}

module.exports = MaxBasePowerAgent;
