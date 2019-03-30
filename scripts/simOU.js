'use strict';

/* eslint-disable no-unused-vars */

require('colors');
const util = require('util');

const PokemonEnv = require('pokemon-env');
const RandomAgent = require('../src/agents/random-agent');
const MaxBasePowerAgent = require('../src/agents/max-base-power-agent');
const MaxDamageAgent = require('../src/agents/max-damage-agent');
const RlAgent = require('../src/agents/rl-agent');
const TeamAwareSimulationAgent = require('../src/core/team-aware-simulation-agent');
const SemiRandomAgent = require('../src/agents/semi-random-agent');
const TestAgent = require('../src/agents/test-agent');
const teams = require('../data/teams');
const storage = require('../src/tracking/storage');
const ReImprove = require('../src/reinforcement-learning/reimprove-js');
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');

// config
const config = {
    'logEpisodes': true,
    'logTime': true,
    'logObservations': false,
    'logP1State': true,
    'logP2State': false,
    'stateDisplay': {
        'showHidden': false,
        'depth': 6,
        'colors': true,
    },
};

// parameters
const numEpisodes = 1000;
const maxSteps = 1000;


// player specs
const p1Spec = {name: 'p1', team: teams['gen7ou'][0]};
const p2Spec = {name: 'p2', team: teams['gen7ou'][1]};
const academy = ReImprove.getAcademy(4, 10);

// agents
// const p1Agent = new MaxDamageAgent('p2', teams['gen7ou'][0], 'gen7ou');
const p1Agent = new SemiRandomAgent();
// const p1Agent = new SemiRandomAgent();
const p2Agent = new RlAgent('p2', teams['gen7ou'][1], 'gen7ou', ReImprove.getAcademy(4, 10));
//const p2Agent = new SemiRandomAgent();
//const p2Agent = new MaxBasePowerAgent('player2', teams['gen7ou'][1]);

// init environment
const env = new PokemonEnv('gen7ou', p1Spec, p2Spec);

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
    if (config.logEpisodes) {
        console.log(`Episode ${episode}`);
    }
    if (config.logTime) {
        console.log('Time: 0');
    }
    if (config.logObservations) {
        console.log(`${observations[0]}`.gray);
    }

    for (let t = 1; t <= maxSteps; t++) {
        // choose actions
        const actions = [
            p1Agent.act(env.actionSpace[0], observations[0], rewards[0], done),
            p2Agent.act(env.actionSpace[1], observations[1], rewards[1], done),
        ];
        // if(actions[0] == undefined && actions[1] == undefined) {
        //     const a = 2;
        // }

        // log p1 action space and action
        // console.log(env.actionSpace[0]);
        // console.log('>> ', actions[0]);

        // advance environment
        ({observations, rewards, done} = env.step(actions));

        // logging
        // if (config.logTime) {
        //     console.log(`Time: ${t}`);
        // }
        // if (config.logObservations) {
        //     console.log(`${observations[0]}`.gray);
        // }
        // if (config.logP1State) {
        //     console.log(util.inspect(p1Agent.state, config.stateDisplay));
        // }
        // if (config.logP2State) {
        //     console.log(util.inspect(p2Agent.state, config.stateDisplay));
        // }

        if (done) {

            const actions = [
                p1Agent.act(env.actionSpace[0], observations[0], rewards[0], done),
                p2Agent.act(env.actionSpace[1], observations[1], rewards[1], done),
            ];

            results.p1Wins += rewards[0] === 1;
            results.p2Wins += rewards[0] === -1;
            results.ties += rewards[0] === 0;
            break;
        }
        ;
    }
}

//saveModel(academy);


async function saveModel(academy) {
    try {
        await academy.agents.values().next().value.model.model.save(
            'file:///home/niklas/WebstormProjects/pokemon-agents/models/model1'
        );
    } catch (e) {
        console.log(e);
    }

}

console.log(results);

env.close();
