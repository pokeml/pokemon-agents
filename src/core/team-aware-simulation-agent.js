'use strict';

const TeamAwareTrackingAgent = require('../core/team-aware-tracking-agent');
const BattleSim = require('../../Pokemon-Showdown/sim/battle');

/**
 * An agent that chooses actions uniformly at random.
 */
class TeamAwareSimulationAgent extends TeamAwareTrackingAgent {
    /**
     * @param {'p1' | 'p2'} id
     * @param {object} team
     * @param {object} oppTeam
     * @param {string} formatId
     * @param {number} [seed]
     * @param {boolean} [debug]
     */
    constructor(id, team, oppTeam, formatId, seed = null, debug = false) {
        super(id, seed, team, debug);

        const battleOptions = {
            formatid: formatId,
            seed: seed ? Array(4).fill(seed) : null,
        };

        this.simulatedBattle = new BattleSim(battleOptions);
        this.simulatedBattle.setPlayer('p1', {name: 'p1', team: team});
        this.simulatedBattle.setPlayer('p2', {name: 'p2', team: oppTeam});
    }

    /**
     * @param {bool} own
     * @return {Pokemon}
     */
    getActiveSimulatedPokemon(own = true) {
        let activeSpecies = null;
        activeSpecies = this.getActivePokemonSpecies(own);
        let pokemon = null;
        if (own) {
            pokemon = this.simulatedBattle.p1.pokemon;
        } else {
            pokemon = this.simulatedBattle.p2.pokemon;
        }
        for (let i = 0; i < pokemon.length; i++) {
            if (pokemon[i].species === activeSpecies) {
                return pokemon[i];
            }
        }
        return pokemon[0];
    }
}

module.exports = TeamAwareSimulationAgent;
