'use strict';

const TeamAwareTrackingAgent = require('../core/team-aware-tracking-agent');
const BattleSim = require('../../Pokemon-Showdown/sim/battle');
<<<<<<< HEAD
=======
const teamInference = require('../state-inference/team-inference');
const storage = require('../tracking/storage');
>>>>>>> 71a42198771e9eb0a21ae17e06f1f13830364bf0

/**
 * An agent that chooses actions uniformly at random.
 */
class TeamAwareSimulationAgent extends TeamAwareTrackingAgent {
    /**
     * @param {'p1' | 'p2'} id
     * @param {object} team
<<<<<<< HEAD
     * @param {object} oppTeam
=======
>>>>>>> 71a42198771e9eb0a21ae17e06f1f13830364bf0
     * @param {string} formatId
     * @param {number} [seed]
     * @param {boolean} [debug]
     */
<<<<<<< HEAD
    constructor(id, team, oppTeam, formatId, seed = null, debug = false) {
        super(id, team, debug);

        const battleOptions = {
            formatid: formatId,
            seed: seed ? Array(4).fill(seed) : null,
        };

        this.simulatedBattle = new BattleSim(battleOptions);
        this.simulatedBattle.setPlayer('p1', {name: 'p1', team: team});
        this.simulatedBattle.setPlayer('p2', {name: 'p2', team: oppTeam});
=======
    constructor(id, team, formatId, seed = null, debug = false) {
        super(id, seed, team, debug);
        this.simulatedBattle = null;
        this.formatId = formatId;
    }

    /**
     * @override
     */
    act(actionSpace, observation, reward, done) {
        super.update(observation);
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
            this.simulatedBattle = new BattleSim(battleOptions);
            this.simulatedBattle.setPlayer('p1', {name: 'p1', team: this.team});
            this.simulatedBattle.setPlayer('p2', {name: 'p2', team: teamOpponent});
        }
>>>>>>> 71a42198771e9eb0a21ae17e06f1f13830364bf0
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
