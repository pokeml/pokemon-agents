'use strict';

/* eslint-disable no-unused-vars */

require('colors');
const util = require('util');

const PokemonEnv = require('pokemon-env');
const RandomAgent = require('../src/agents/random-agent');
const SemiRandomAgent = require('../src/agents/semi-random-agent');
const SimpleAgent = require('../src/agents/random-agent');
const teams = require('../data/teams');

// config
const config = {
    'logEpisodes': true,
    'logTime': true,
    'logObservations': false,
    'logP1State': false,
    'logP2State': false,
    'stateDisplay': {
        'showHidden': false,
        'depth': 4,
        'colors': true,
    },
};

// parameters
const numEpisodes = 100;
const maxSteps = 1000;

// agents
const p1Agent = new SemiRandomAgent();
const p2Agent = new RandomAgent();

// player specs
const p1Spec = {name: 'Player 1', team: teams[0]};
const p2Spec = {name: 'Player 2', team: teams[1]};

// init environment
const env = new PokemonEnv('gen7randombattle', p1Spec, p2Spec);

const results = {
    'p1Wins': 0,
    'p2Wins': 0,
    'ties': 0,
};

// main loop
for (let episode = 1; episode <= numEpisodes; episode++) {
    // reset
    let observations = env.reset();
    let rewards = [0, 0];
    let done = false;

    p1Agent.reset();
    p2Agent.reset();

    // logging
    console.clear();
    if (config.logEpisodes) console.log(`Episode ${episode}`);
    if (config.logTime) console.log('Time: 0');
    if (config.logObservations) console.log(`${observations[0]}`.gray);

    for (let t = 1; t <= maxSteps; t++) {
        // choose actions
        const actions = [
            p1Agent.act(env.actionSpace[0], observations[0], rewards[0], done),
            p2Agent.act(env.actionSpace[1], observations[1], rewards[1], done),
        ];

        // console.log(env.actionSpace[0]);
        // console.log('>> ', actions[0]);

        // advance environment
        ({observations, rewards, done} = env.step(actions));

        // logging
        if (config.logTime) console.log(`Time: ${t}`);
        if (config.logObservations) console.log(`${observations[0]}`.gray);
        if (config.logP1State) {
            console.log(util.inspect(p1Agent.state, config.stateDisplay));
        }
        if (config.logP2State) {
            console.log(util.inspect(p2Agent.state, config.stateDisplay));
        }

        if (done) {
            results.p1Wins += rewards[0] === 1;
            results.p2Wins += rewards[0] === -1;
            results.ties += rewards[0] === 0;
            break;
        };
    }
}

console.log(results);

env.close();
