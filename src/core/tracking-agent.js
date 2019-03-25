'use strict';

const _ = require('underscore');

const Agent = require('./agent');
const Battle = require('../tracking/battle');
const splitFirst = require('../../utils/utils').splitFirst;

/**
 * An agent that can keep track of the battle state from its observations.
 */
class TrackingAgent extends Agent {
    /**
     * @param {'p1' | 'p2'} id
     * @param {boolean} [debug]
     */
    constructor(id, debug = false) {
        super();
        if (id !== 'p1' && id !== 'p2') {
            throw new Error('invalid player id');
        }
        this.id = id;
        this.debug = debug;

        this._request = /** @type {Request} */ null;
        this._battle = /** @type {Battle} */ null;

        this.reset();
    }

    /**
     * Update the agent's state.
     *
     * @param {string} observation
     */
    update(observation) {
        for (const line of observation.split('\n')) {
            if (this.debug) {
                console.log(`${line}`.gray);
            }
            if (line.charAt(0) !== '|') return;
            const [cmd, rest] = splitFirst(line.slice(1), '|');
            // invalid choices can happen despite normal behavior, e.g. if a Pokémon is trapped
            const ignoredErrors = [`[Invalid choice] Can't switch: The active Pokémon is trapped`];
            if (cmd === 'error' && !(rest in ignoredErrors)) {
                throw new Error(rest);
            } else if (cmd === 'request') {
                this._request = JSON.parse(rest);
            }
            this._battle.activityQueue.push(line);
        }
        this._battle.update();
    }

    /**
     * Get the current agent state.
     *
     * @return {Object}
     */
    get state() {
        // pick useful properties of battle state
        const battleKeys = [
            'turn', 'weather', 'pseudoWeather', 'weatherTimeLeft', 'weatherMinTimeLeft', 'lastMove',
            'gen', 'teamPreviewCount', 'speciesClause', 'tier', 'gameType', 'endLastTurnPending',
        ];
        const sideKeys = [
            'name', 'id', 'totalPokemon', 'missedPokemon', 'wisher', 'sideConditions', 'n',
        ];
        const omittedPokemonKeys = ['side', 'spriteid'];

        const pickBattleKeys = (battle) => _.pick(battle, battleKeys);
        const pickSideKeys = (side) => _.pick(side, sideKeys);
        const omitPokemonKeys = (pokemon) => _.omit(pokemon, omittedPokemonKeys);

        const state = pickBattleKeys(this._battle);
        state.mySide = pickSideKeys(this._battle.mySide);
        state.mySide.active = this._battle.mySide.active.map(omitPokemonKeys);
        state.mySide.pokemon = this._battle.mySide.pokemon.map(omitPokemonKeys);
        state.yourSide = pickSideKeys(this._battle.yourSide);
        state.yourSide.active = this._battle.yourSide.active.map(omitPokemonKeys);
        state.yourSide.pokemon = this._battle.yourSide.pokemon.map(omitPokemonKeys);

        // add info from request object
        // if (this._request.active) {
        //     state.mySide.active[0].moves = this._request.active[0];
        // }
        // const pokemonKeys = [
        //     'condition', 'active', 'stats', 'moves', 'item', 'baseAbility', 'ability',
        // ];
        // for (const pokemon of state.mySide.pokemon) {
        //     for (const p of this._request.side.pokemon) {
        //         if (pokemon.ident === p.ident) {
        //             for (const key of pokemonKeys) {
        //                 pokemon[key] = p[key];
        //             }
        //         }
        //     }
        // }
        state.request = this._request;

        return state;
    }

    /**
     * @override
     */
    reset() {
        if (this._battle) {
            this._battle.destroy();
        }
        this._battle = new Battle();
        this._battle.customCallback = (battle, type, args, kwargs) => {
            switch (type) {
            case 'trapped':
                this._request.active[0].trapped = true;
                break;
            case 'cant':
                const moves = this._request.active[0].moves;
                for (let i = 0; i < moves.length; i++) {
                    if (moves[i].id === args[3]) {
                        moves[i].disabled = true;
                    }
                }
                break;
            }
        };
        this._request = null;
    }

    /**
     * @return {Side}
     */
    getOwnSide() {
        if (this.id === 'p1') {
            return this._battle.p1;
        }
        return this._battle.p2;
    }

    /**
     * @return {Side}
     */
    getOpponentSide() {
        if (this.id === 'p1') {
            return this._battle.p2;
        }
        return this._battle.p1;
    }

    /**
     * @param {bool} own
     * @return {string}
     */
    getActivePokemonSpecies(own=true) {
        if (own) {
            const active = this.getOwnSide().active[0];
            if (active == null) {
                return '';
            }
            return active.species;
        }
        const active = this.getOpponentSide().active[0];
        if (active == null) {
            return '';
        }
        return active.species;
    }
}

module.exports = TrackingAgent;
