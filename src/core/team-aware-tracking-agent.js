'use strict';

const TrackingAgent = require('../core/tracking-agent');
const BattleDex = require('../tracking/battle-dex');
const storage = require('../tracking/storage');
/**
 * An agent that chooses actions uniformly at random.
 */
class TeamAwareTrackingAgent extends TrackingAgent {
    /**
     * @param {'p1' | 'p2'} id
<<<<<<< HEAD
     * @param {object} team
     * @param {boolean} [debug]
     */
    constructor(id, team, debug = false) {
        super(id, debug);
=======
     * @param {number} [seed]
     * @param {object} team
     * @param {boolean} [debug]
     */
    constructor(id, seed, team, debug = false) {
        super(id, debug, seed);
        this.team = team;
>>>>>>> 71a42198771e9eb0a21ae17e06f1f13830364bf0
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
            if (this.unpackedTeam[i].species == activePokemonSpecies) {
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

module.exports = TeamAwareTrackingAgent;
