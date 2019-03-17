'use strict';

const TrackingAgent = require('../core/tracking-agent');
const BattleDex = require('../tracking/battle-dex');

/**
 * An agent that chooses actions uniformly at random.
 */
class TeamAwareTrackingAgent extends TrackingAgent {
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

module.exports = TeamAwareTrackingAgent;
