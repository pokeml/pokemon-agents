'use strict';

/* eslint-disable no-unused-vars */

require('colors');
const util = require('util');
const teams = require('../data/teams');
const PokemonEnv = require('pokemon-env');
const RandomAgent = require('../src/agents/random-agent');
const SimAgent = require('../src/agents/sim-agent');


const numEpisodes = 1;
const maxSteps = 1000;

const p1Agent = new SimAgent();
const p2Agent = new RandomAgent();

const p1Spec = {name: 'Player 1', team: teams['gen7ou'][0]};
const p2Spec = {name: 'Player 2', team: teams['gen7ou'][1]};

const env = new PokemonEnv('gen7ou', p1Spec, p2Spec);
const results = {
    'p1Wins': 0,
    'p2Wins': 0,
    'ties': 0,
};

for (let episode = 1; episode <= numEpisodes; episode++) {
    let observations = env.reset();
    let rewards = [0, 0];
    let done = false;

    p1Agent.reset();
    p2Agent.reset();

    for (let t = 1; t <= maxSteps; t++) {
        console.log(`t: ${t}, turn: ${env.battle.turn}`);

        const actionSpace = env.actionSpace;
        const actions = [
            p1Agent.act(actionSpace[0], env.battle, rewards[0], done),
            p2Agent.act(actionSpace[1], observations[1], rewards[1], done),
        ];

        ({observations, rewards, done} = env.step(actions));

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
