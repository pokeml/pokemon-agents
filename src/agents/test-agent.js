'use strict';

/* eslint-disable */

const _ = require('underscore');

const Encoder = require('../core/encoder');
const TrackingAgent = require('../core/tracking-agent');
const toId = require('../../utils/utils').toId;

const pokemon = [
    'tapukoko', 'landorus', 'landorustherian', 'toxapex', 'serperior', 'celesteela', 'medicham',
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
const vocab = {
    'pokemon': pokemon,
    'move': moves,
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
        this.encoder = new Encoder(vocab, 'gen7ou');
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
        const moves = state.request.active ? state.request.active[0].moves.map((m) => m.move) : [null, null, null, null];

        const features = [
            ['my_active', 'pokemon', myActive],
            ['your_active', 'pokemon', yourActive],
            ['team', 'pokemon', myPokemon],
            ['moves', 'move', moves],
        ];
        return this.encoder.encode(features);
    }
}

module.exports = TestAgent;
