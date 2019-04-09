'use strict';

const execSync = require('child_process').execSync;
const fs = require('fs');

const _ = require('lodash');
const seedrandom = require('seedrandom');

const {MoveAction, SwitchAction, TeamAction} = require('./actions');
const Agent = require('../core/agent');

/**
 * An agent that chooses actions based on forward simulation.
 */
class SimAgent extends Agent {
    /**
     * @param {number} [seed]
     */
    constructor(seed = null) {
        super();
        this.seed = seed;
        this.random = seedrandom(seed);
    }

    /**
     * @override
     */
    act(actionSpace, observation, reward, done) {
        if (actionSpace.length === 0) {
            return null;
        }
        const actions = this._getActionSpace(observation);
        let game = `${actions[0].length} ${actions[1].length}\n\n`;
        const matrix = [];
        // let simCount = 1;
        const startTime = new Date();
        for (const p1Action of actions[0]) {
            const row = [];
            for (const p2Action of actions[1]) {
                // console.log(`Sim #${simCount++}`);

                const battle = _.cloneDeep(observation);

                battle.choose('p1', p1Action.choice);
                battle.choose('p2', p2Action.choice);

                const features = this._getFeatures(battle);
                const weights = this._getWeights();
                let value = 0;
                for (const key of Object.keys(features)) {
                    value += features[key] * weights[key];
                }
                row.push(value);
            }
            matrix.push(row);
        }
        const endTime = new Date();
        const deltaTime = (endTime - startTime) / 1000;
        console.log(`Simulation time: ${deltaTime}s`);

        const n = 5;
        for (const row of matrix) {
            const r = [];
            for (const value of row) {
                const a = Math.pow(10, n);
                const v = `${Math.round(a * value)}/${a}`;
                r.push(v);
            }
            game += r.join(' ');
            game += '\n';
        }
        game += '\n';
        for (const row of matrix) {
            const r = [];
            for (const value of row) {
                const a = Math.pow(10, n);
                const v = `${-Math.round(a * value)}/${a}`;
                r.push(v);
            }
            game += r.join(' ');
            game += '\n';
        }

        const dir = '/tmp/pkmn';
        const file = `${dir}/game.txt`;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {'recursive': true});
        }
        fs.writeFileSync(file, game);

        const output = execSync(`./lib/lrsnash ${file}`).toString();

        let value;
        let p1Strategy;
        let p2Strategy;
        for (const line of output.split('\n')) {
            if ((line.startsWith('1') && !p1Strategy) || (line.startsWith('2') && !p2Strategy)) {
                const parts = line.trim().split(/ +/);
                const strategy = [];
                for (let i = 1; i < parts.length - 1; i++) {
                    strategy.push(eval(parts[i]));
                }
                if (line.startsWith('1')) {
                    p1Strategy = strategy;
                } else {
                    p2Strategy = strategy;
                }
                if (!value) {
                    value = eval(parts[parts.length - 1]);
                }
            }
        }

        console.log(`Payoff matrix:`);
        this._printMatrix(matrix);
        console.log(`---`);
        console.log(`Value: ${value}`);
        console.log(`---`);
        console.log(`Player 1's strategy:`);
        for (let i = 0; i < actionSpace.length; i++) {
            console.log(`${actionSpace[i]}: ${p1Strategy[i]}`);
        }
        console.log(`---`);
        console.log(`Player 2's strategy:`);
        for (let i = 0; i < actions[1].length; i++) {
            console.log(`${actions[1][i]}: ${p2Strategy[i]}`);
        }

        return this._sample(actionSpace, p1Strategy);
    }

    /**
     * @override
     */
    reset() {
        this.random = seedrandom(this.seed);
    }

    /**
     * Sample a random element from an array according to a weighted probability
     * distribution.
     *
     * @param {Array} arr
     * @param {Array} probs
     * @return {Object}
     */
    _sample(arr, probs) {
        const sum = probs.reduce((a, b) => a + b, 0);
        const norm = probs.map((prob) => prob / sum);
        const sample = this.random();
        let total = 0;
        for (let i = 0; i < norm.length; i++) {
            total += norm[i];
            if (sample < total) {
                return arr[i];
            }
        }
    }

    /**
     * Get the joint action space for both players of a battle.
     *
     * @param {Battle} battle
     * @return {Array}
     */
    _getActionSpace(battle) {
        const p1Request = this._getRequest(battle, 'p1');
        const p2Request = this._getRequest(battle, 'p2');
        const p1ActionSpace = this._getActionsFromRequest(p1Request);
        const p2ActionSpace = this._getActionsFromRequest(p2Request);
        return [p1ActionSpace, p2ActionSpace];
    }

    /**
	 * @param {Battle} battle
     * @param {string} player
     * @return {Object}
	 */
    _getRequest(battle, player) {
        const type = battle[player].currentRequest;
        let request = null;
        const switchTable = [];
        switch (type) {
        case 'switch': {
            for (const active of battle[player].active) {
                switchTable.push(!!(active && active.switchFlag));
            }
            if (switchTable.some((flag) => flag === true)) {
                request = {forceSwitch: switchTable, side: battle[player].getData()};
            }
            break;
        }
        case 'teampreview':
            const teamLengthData = battle.getFormat().teamLength;
            let maxTeamSize = teamLengthData && teamLengthData.battle;
            if (!maxTeamSize) maxTeamSize = 6;
            request = {teamPreview: true, maxTeamSize: maxTeamSize, side: battle[player].getData()};
            break;

        default: {
            const activeData = battle[player].active.map(
                (pokemon) => pokemon && pokemon.getRequestData()
            );
            request = {active: activeData, side: battle[player].getData()};
        }
        }
        return request;
    }

    /**
     * Return a list of all possible actions in the current battle state for the
     * given side. Currently only works for single battles.
     *
     * TODO: adapt for double and triple battles.
     *
     * @param {Request} request
     * @return {Action[]}
     */
    _getActionsFromRequest(request) {
        if (request.forceSwitch) {
            const pokemon = request.side.pokemon;
            const switches = [1, 2, 3, 4, 5, 6].filter((i) => (
                // exists
                pokemon[i - 1] &&
                // not active
                !pokemon[i - 1].active &&
                // not fainted
                !pokemon[i - 1].condition.endsWith(' fnt')
            ));
            return switches.map((i) => new SwitchAction(
                i,
                pokemon[i - 1].ident.slice(4),
            ));
        } else if (request.active) {
            const active = request.active[0];
            const pokemon = request.side.pokemon;
            const actionSpace = [];
            // moves
            const moves = [1, 2, 3, 4].slice(0, active.moves.length).filter((i) => (
                // not disabled
                !active.moves[i - 1].disabled
            ));
            actionSpace.push(...moves.map((i) => new MoveAction(
                i,
                active.moves[i - 1].move,
            )));
            // moves + mega evo
            if (active.canMegaEvo) {
                actionSpace.push(...moves.map((i) => new MoveAction(
                    i,
                    active.moves[i - 1].move,
                    {'mega': true},
                )));
            }
            // zmoves
            if (active.canZMove) {
                const zmoves = [1, 2, 3, 4].slice(0, active.canZMove.length).filter((i) =>
                    active.canZMove[i - 1]
                );
                actionSpace.push(...zmoves.map((i) => new MoveAction(
                    i,
                    active.moves[i - 1].move,
                    {'zmove': true}
                )));
            }
            // switches
            if (!active.trapped) {
                const switches = [1, 2, 3, 4, 5, 6].filter((i) => (
                    // exists
                    pokemon[i - 1] &&
                    // not active
                    !pokemon[i - 1].active &&
                    // not fainted
                    !pokemon[i - 1].condition.endsWith(' fnt')
                ));
                actionSpace.push(...switches.map((i) => new SwitchAction(
                    i,
                    pokemon[i - 1].ident.slice(4),
                )));
            }
            return actionSpace;
        } else if (request.teamPreview) {
            // TODO: formats where max team size is limited
            const actionSpace = [];
            const teamSize = request.side.pokemon.length;
            if (teamSize > 6) {
                throw new Error(`team size > 6: ${teamSize}`);
            }
            for (let i = 1; i <= teamSize; i++) {
                const team = [];
                for (let j = 1; j <= teamSize; j++) {
                    if (j == 1) team.push(i);
                    else if (j == i) team.push(1);
                    else team.push(j);
                }
                actionSpace.push(new TeamAction(team.join('')));
            }
            return actionSpace;
        } else {
            // wait request
            return [];
        }
    }

    /**
     * Create a feature vector from a battle state.
     *
     * @param {Battle} battle
     * @return {Object}
     */
    _getFeatures(battle) {
        const features = {};
        for (const player of ['p1', 'p2']) {
            for (let i = 0; i < 6; i++) {
                const pokemon = battle[player].pokemon[i];
                features[`${player}_pkmn${i + 1}_hp`] = pokemon.hp / pokemon.maxhp;
            }
        }
        return features;
    }

    /**
     * Get the weights for a linear value function.
     *
     * @return {Object}
     */
    _getWeights() {
        const weights = {};
        for (let i = 0; i < 6; i++) {
            weights[`p1_pkmn${i + 1}_hp`] = 1;
        }
        for (let i = 0; i < 6; i++) {
            weights[`p2_pkmn${i + 1}_hp`] = -1;
        }
        return weights;
    }

    /**
     * @param {Array} matrix
     */
    _printMatrix(matrix) {
        for (const row of matrix) {
            const r = [];
            for (const val of row) {
                r.push(val.toFixed(2));
            }
            console.log(r.join('\t'));
        }
    }
}

module.exports = SimAgent;
