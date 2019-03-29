'use strict';

/* eslint-disable */

const _ = require('underscore');

const Encoder = require('../core/encoder');
const BaseAgent = require('../core/base-agent');
const tools = require('../../utils/tools');

const pokemon = [
    'tapukoko', 'landorus', 'landorustherian', 'toxapex', 'serperior', 'celesteela', 'medicham',
    'medichammega', 'ninetalesalola', 'magearna', 'zygarde', 'mawile', 'mawilemega', 'manaphy',
];
const moves = [
    'fakeout', 'highjumpkick', 'zenheadbutt', 'icepunch',
    'heavyslam', 'protect', 'earthquake', 'leechseed',
    'thunderbolt', 'uturn', 'hiddenpowerice', 'taunt',
    'scald', 'toxicspikes', 'recover', 'toxic',
    'earthquake', 'uturn', 'stealthrock', 'hiddenpowerice',
    'leafstorm', 'leechseed', 'substitute', 'hiddenpowerfire',
];
const vocab = {
    'pokemon': pokemon.sort(),
    'move': moves.sort(),
};

/**
 * A test agent.
 */
class TestAgent extends BaseAgent {
    /**
     * @param {string} id
     */
    constructor(id) {
        super(id);
        this.encoder = new Encoder(vocab, 'gen7ou');
    }

    /**
     * @override
     */
    act(actionSpace, observation, reward, done) {
        super.updateState(observation);
        return _.sample(actionSpace);
    }

    /**
     * @override
     */
    get state() {
        const state = super.state;

        const myActive = state.mySide.active[0].id;
        const yourActive = state.yourSide.active[0].id;
        const team = state.request.side.pokemon.map((pokemon) => tools.toId(pokemon.ident.substring(3)));
        const moves = state.request.active ? state.request.active[0].moves.map((m) => tools.toId(m.move)) : [null, null, null, null];

        const features = [
            ['bias', 'number', 1],
            ['my_active', 'pokemon', myActive],
            ['your_active', 'pokemon', yourActive],
            ['team', 'pokemon', team],
            ['moves', 'move', moves],
        ];
        return this.encoder.encode(features);
    }
}

module.exports = TestAgent;
