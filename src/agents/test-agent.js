'use strict';

/* eslint-disable */

const _ = require('underscore');

const Encoder = require('../core/encoder');
const TrackingAgent = require('../core/tracking-agent');
const toId = require('../../utils/utils').toId;

/**
 * Create a dictionary that maps each element of the given array to its index.
 *
 * @param {Array} arr
 * @return {Object}
 */
const createDict = function(arr) {
    if (!arr.every((element) => typeof element === 'string')) {
        throw new Error('Array must only contain strings');
    }
    const uArr = _.uniq(arr);
    const dict = {};
    for (let i = 0; i < uArr.length; i++) {
        dict[uArr[i]] = i;
    }
    return dict;
};

const pokemon = [
    'tapukoko', 'landorustherian', 'toxapex', 'serperior', 'celesteela', 'medicham',
    'medichammega', 'ninetalesalola', 'magearna', 'zygarde', 'mawile', 'mawilemega', 'manaphy',
];
const moves = [
    'Fake Out', 'High Jump Kick', 'Zen Headbutt', 'Ice Punch',
    'Heavy Slam', 'Protect', 'Earthquake', 'Leech Seed',
    'Thunderbolt', 'U-turn', 'Hidden Power Ice', 'Taunt',
    'Scald', 'Toxic Spikes', 'Recover', 'Toxic',
    'Earthquake', 'U-turn', 'Stealth Rock', 'Hidden Power Ice',
    'Leaf Storm', 'Leech Seed', 'Substitute', 'Hidden Power Fire',
];

const dict = {
    'pokemon': createDict(pokemon),
    'move': createDict(moves),
};

/**
 * A test agent.
 */
class TestAgent extends TrackingAgent {
    /**
     *
     */
    constructor() {
        super();
        this.encoder = new Encoder(dict);
    }

    /**
     * @override
     */
    act(actionSpace, observation, reward, done) {
        super.update(observation);
        return _.sample(actionSpace);
    }

    /**
     * @override
     */
    get state() {
        const state = super.state;

        const myActive = state.mySide.active[0].id;
        const yourActive = state.yourSide.active[0].id;
        const myPokemon = state.request.side.pokemon.map((pokemon) => toId(pokemon.ident.substring(3)));
        const moves = state.request.active ? state.request.active[0].moves.map((m) => m.id) : [null, null, null, null];

        return {
            'myActive': myActive,
            'yourActive': yourActive,
            'myPokemon': myPokemon,
            'moves': moves,
        };
    }
}

module.exports = TestAgent;
