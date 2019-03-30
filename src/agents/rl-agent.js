'use strict';

const TeamAwareSimulationAgent = require('../core/team-aware-simulation-agent');
const ActionDecoding = require('../encoding/action-encoding');
require('reimprovejs/dist/reimprove');
const deasync = require('deasync');

/**
 * An agent that uses reinforcement learning to figure out how to play
 */
class RlAgent extends TeamAwareSimulationAgent {
    /**
     * @param {'p1' | 'p2'} id
     * @param {object} team
     * @param {string} formatId
     * @param {Academy} academy
     * @param {number} [seed]
     * @param {boolean} [debug]
     */
    constructor(id, team, formatId, academy, seed = null, debug = false) {
        super(id, team, formatId, seed, debug);
        this.academy = academy;
    }

    /**
     * @override
     */
    act(actionSpace, observation, reward, done) {
        super.act(actionSpace, observation, reward, done);
        // simulatedBattle object is only instantiated after team preview
        if (this.simulatedBattle === null) {
            return this._sample(actionSpace);
        }
        const moves = this.getCurrentMoves();
        let damage = [];
        for (let i = 0; i < moves.length; i++) {
            const simulatedPokemonOwn = this.getActiveSimulatedPokemon(true);
            const dam = damage.concat(
                this.simulatedBattle.getDamage(
                    simulatedPokemonOwn,
                    this.getActiveSimulatedPokemon(false),
                    simulatedPokemonOwn.moveSlots[i].move
                )
            );
            if (dam !== undefined) {
                damage = dam;
            } else {
                damage = 0;
            }
        }
        if (damage.length === 0) {
            return this._sample(actionSpace);
        }
        const agentName = this.academy.agents.values().next().value.Name;
        let actionIndex;

        this.academy.step(
            [
                {
                    teacherName: this.academy.teachers.values().next().value.Name,
                    agentsInput: damage,
                },
            ]
        ).then(function (data) {
            actionIndex = data.values().next().value;
        })
        require('deasync').sleep(1);
        const chosenAction = ActionDecoding.decodeAction(
            actionIndex
        );
        this.academy.addRewardToAgent(agentName, reward);
        for (let i = 0; i < actionSpace.length; i++) {
            if (actionSpace[i].choice === chosenAction.choice) {
                return chosenAction;
            }
        }


        return this._sample(actionSpace);
    }
}

module.exports = RlAgent;
