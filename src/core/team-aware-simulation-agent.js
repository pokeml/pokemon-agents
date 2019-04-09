'use strict';

const TeamAwareAgent = require('./team-aware-agent');
const Battle = require('../../Pokemon-Showdown/sim/battle');
const teamInference = require('../state-inference/team-inference');
const storage = require('../tracking/storage');

/**
 * An agent that chooses actions uniformly at random.
 */
class TeamAwareSimulationAgent extends TeamAwareAgent {
    /**
     * @param {'p1' | 'p2'} id
     * @param {object} team
     * @param {string} formatId
     * @param {number} [seed]
     * @param {boolean} [debug]
     */
    constructor(id, team, formatId, seed = null, debug = false) {
        super(id, seed, team, debug);
        this.simulatedBattle = null;
        this.formatId = formatId;
    }

    /**
     * @override
     */
    act(actionSpace, observation, reward, done) {
        super.updateState(observation);
        const state = this.state;
        if (state.request.teamPreview) {
            const teamOpponent = storage.packTeam(
                teamInference.assumeTeamWithUniformStats(
                    this.getOpponentSide().pokemon
                )
            );

            const battleOptions = {
                formatid: this.formatId,
                seed: this.seed ? Array(4).fill(this.seed) : null,
            };
            this.simulatedBattle = new Battle(battleOptions);
            this.simulatedBattle.setPlayer('p1', {name: 'p1', team: this.team});
            this.simulatedBattle.setPlayer('p2', {name: 'p2', team: teamOpponent});
        }
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
