'use strict';

const BaseAgent = require('../core/base-agent');
const BattleDex = require('../tracking/battle-dex');
const storage = require('../tracking/storage');
/**
 * An agent that chooses actions uniformly at random.
 */
class TeamAwareAgent extends BaseAgent {
    /**
     * @param {'p1' | 'p2'} id
     * @param {number} [seed]
     * @param {object} team
     * @param {boolean} [debug]
     */
    constructor(id, seed, team, debug = false) {
        super(id, seed, debug);
        this.team = team;
        this.unpackedTeam = storage.unpackTeam(team);
    }

    /**
     * @return {Array}
     */
    getCurrentMoves() {
        if (this.getOwnSide().active[0] == null) {
            return [];
        }
        const activePokemonSpecies = this.getActivePokemonSpecies();
        for (let i = 0; i < this.unpackedTeam.length; i++) {
            if (this.unpackedTeam[i].species === activePokemonSpecies) {
                const moves = [];
                for (let j = 0; j < this.unpackedTeam[i].moves.length; j++) {
                    moves[j] = BattleDex.getMove(this.unpackedTeam[i].moves[j]);
                }
                return moves;
            }
        }
        return [];
    }
}

module.exports = TeamAwareAgent;
