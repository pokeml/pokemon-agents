'use strict';

const TeamAwareSimulationAgent = require('../core/team-aware-simulation-agent');

/**
 * An agent that always uses the attack dealing the maximal damage to the opponents
 * currently active pokemon
 */
class MaxDamageAgent extends TeamAwareSimulationAgent {
    /**
     * @override
     */
    act(actionSpace, observation, reward, done) {
        super.act(actionSpace, observation, reward, done);

        // simulatedBattle object is only instantiated after team preview
        if (this.simulatedBattle === null) {
            return this._sample(actionSpace);
        }
        let maxDamage = -1;
        let maxDamageIndex = 0;
        const moves = this.getCurrentMoves();
        for (let i = 0; i < moves.length; i++) {
            const simulatedPokemonOwn = this.getActiveSimulatedPokemon(true);
            const damage = this.simulatedBattle.getDamage(
                simulatedPokemonOwn,
                this.getActiveSimulatedPokemon(false),
                simulatedPokemonOwn.moveSlots[i].move
            );
            if (damage > maxDamage) {
                maxDamage = damage;
                maxDamageIndex = i;
            }
        }
        if (typeof actionSpace[maxDamageIndex] !== undefined) {
            return actionSpace[maxDamageIndex];
        }
        return this._sample(actionSpace);
    }
}

module.exports = MaxDamageAgent;
