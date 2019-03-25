'use strict';

const _ = require('underscore');
const checks = require('../../data/compTest.json');
const types = require('../../data/types.js');
const pokedex = require('../../Pokemon-Showdown/data/pokedex.js');
const TrackingAgent = require('../core/tracking-agent');
// TODO: create custom pokedex. rm unnecessary info to make search faster

// const actions = require('./actions');

// const MoveAction = actions.MoveAction;
// const SwitchAction = actions.SwitchAction;
// const TeamAction = actions.TeamAction;
const BattleTypeChart = types.BattleTypeChart;
const BattlePokedex = pokedex.BattlePokedex;

/**
 * An agent that chooses actions based on checks.json and types.js
 */
class ChecksSwitchAgent extends TrackingAgent {
    /**
     * @param {'p1' | 'p2'} id
     * @param {boolean} [debug]
     */
    constructor(id, debug = false) {
        super(id, debug);
        // this._xsiMatchupMatrix = new Array(6).fill(new Array(6)); // didn't work
        this._faintedList = null;
        this._xsiMatchupMatrix = null;
        this._typesMatchupMatrix = null;
        this._myMonsList = null;
        this._oppMonsList = null;
        this._myMonsKeys = null;
        this._oppMonsKeys = null;
    }

    /**
     * @override
     */
    act(actionSpace, observation, reward, done) {
        super.update(observation);
        // TODO: if opponent chose uturn/voltswitch/etc. skip computing

        if (info.teamPreview) {
            this._handleTeamPreview(info, battle);
        }

        // get my active mon
        let myActiveMon;
        let oppActiveMon;
        const myMons = info.side.pokemon;
        for (const pokemon of myMons) {
            if (pokemon.active == true) {
                myActiveMon = this._normName(pokemon.details);
            }
        }

        // get the opponent's active mon
        // if p1, go into Bot 2's pokemon list to search for the active pokemon
        if (this.id === 'p1') {
            if (battle.sides[1].active[0]) {
                oppActiveMon = this._normName(battle.sides[1].active[0].details);
            } else {
                oppActiveMon = 'missingno';
                // console.log('Not initialized yet');
            }
        } else {
            if (battle.sides[0].active[0]) {
                oppActiveMon = this._normName(battle.sides[0].active[0].details);
            } else {
                oppActiveMon = 'missingno';
                // console.log('Not initialized yet');
            }
        }

        // get the current matchup based on checksgraph
        const xsiactiveMatchup = this._xsilookUpInMatchupMatrix(myActiveMon, oppActiveMon);
        // find the opposing active pokemon on the graph and store its checks and counters
        const oppMonChecks = checks[oppActiveMon];
        // search in lists for the own active pokemon
        let typeOfCheck;
        if (oppMonChecks) {
            typeOfCheck = this._matchUpValueToXsi(xsiactiveMatchup);
        }

        // get the current meatchup based on typesgraph
        const typesactiveMatchup = this._typeslookUpInMatchupMatrix(myActiveMon, oppActiveMon);

        // console.log(`>> ${this.id}: I'm ${this.id}, my opponent is ${opponent}.`);
        console.log(`>> ${this.id}: My active ${myActiveMon} is ${typeOfCheck} `
            + `to my opponent's active ${oppActiveMon}`);

        let action;
        // if it's the first turn (team preview), choose lead and return
        if (info.teamPreview) {
            // TODO: choose lead here
            action = _.sample(actions);
            return action;
        }

        // try to find a pokemon on your team that does better against the current opposing pokemon.
        // if the current pokemon is already the best choice, attack.
        // if there is a pokemon that does better against the current opposing pokemon, switch to it
        const xsibestSwitch = this._xsiGetBestSwitch(battle, actions, info,
            xsiactiveMatchup, myActiveMon, oppActiveMon);
        console.log('   --');
        const typebestSwitch = this._typeGetBestSwitch(battle, actions, info,
            typesactiveMatchup, myActiveMon, oppActiveMon);
        if (xsibestSwitch) {
            console.log(`>> ${this.id}: xsi best switch`);
            console.log(typebestSwitch);
            console.log(`>> ${this.id}: type best switch`);
            console.log(xsibestSwitch);
            action = xsibestSwitch;
        } else {
            const moveIsPossible = this._actionTypePossible(actions, 'move');
            if (moveIsPossible) {
                // only keep MoveActions
                const stayInActions = actions.filter((e) => (e.type === 'move'));
                // TODO: 1v1
                action = _.sample(stayInActions);
            } else {
                console.log(`>> ${this.id}: No switch was recommended.`);
                console.log(actions);
                action = _.sample(actions);
            }
        }

        return action;
    }

    /**
     * Choose an action.
     *
     * @param {AnyObject} battle
     * @param {string[]} actions
     * @param {AnyObject} info
     * @return {string}
     */
    // act(battle, actions, info) {
    //
    // }

    /**
     * calculates the best switch possible in current turn
     * when only one switch option possible in actions (length==1). this function returns it
     *
     * @param {battle} battle
     * @param {actions} actions
     * @param {info} info
     * @param {int} activeMatchup current matchup Value of myActiveMon vs. oppActiveMon
     * @param {string} myActiveMon
     * @param {string} oppActiveMon
     * @return {action} if null, it signals to caller that no switch shall be done
     */
    _xsiGetBestSwitch(battle, actions, info, activeMatchup, myActiveMon, oppActiveMon) {
        let returnAction = null;
        // check if bigger value exists in matchupMatrix compared to activeMatchup
        // look at opposing mon's column and determine max
        // TODO: integrate static max for every column into MUMatrix, maybe in a MUMatrix object
        // TODO: but current code makes fainted-skips easier

        // maximum Matchup Value in column of oppActiveMon in MUMatrix, active and fainted excluded
        let maxMatchupValue = -2;
        let currentMatchupValue;
        // index of oppMon in MUMatrix
        const oppMonIndex = this._oppMonsKeys[oppActiveMon];
        // let switchToName;
        let switchToNameBest;
        let switchToNameBestOld;
        let oldMax;
        for (let i = 0; i < 6; i++) {
            currentMatchupValue = this._xsiMatchupMatrix[i][oppMonIndex];
            if (currentMatchupValue > maxMatchupValue) {
                oldMax = maxMatchupValue;
                maxMatchupValue = currentMatchupValue;
                switchToNameBestOld = switchToNameBest;
                switchToNameBest = this._myMonsList[i];
                if (this._isFainted(this._myMonsList[i], info)) {
                    console.log(`>> ${this.id}(GBS): ${this._myMonsList[i]} fainted`);
                    maxMatchupValue = oldMax;
                    switchToNameBest = switchToNameBestOld;
                }
                if (this._isActive(this._myMonsList[i], info)) {
                    console.log(`>> ${this.id}(GBS): ${this._myMonsList[i]} is already active`);
                    maxMatchupValue = oldMax;
                    switchToNameBest = switchToNameBestOld;
                    // console.log(`>> ${this.id}(GBS): Next best switch is ${switchToNameBest}`);
                }
            }
        }
        console.log(`>> ${this.id}(GBS): activeMatchup ${activeMatchup}, `
          + `maxMatchupValue ${maxMatchupValue}`);
        console.log(`>> ${this.id}(GBS): Besides staying in, `
          + `best switch would be ${switchToNameBest}`);

        if (maxMatchupValue <= activeMatchup) {
            // don't switch, a best check already active
            console.log(`>> ${this.id}(GBS): A best check already active`);
            // if no moveactions possible, recommend switch anyway with a best switch
            const moveIsPossible = this._actionTypePossible(actions, 'move');
            if (!moveIsPossible) {
                console.log(`>> ${this.id}(GBS): No move is possible, recommend switch anyway.`);
                const switchIsPossible = this._actionTypePossible(actions, 'switch');
                if (switchIsPossible) {
                    console.log(`>> ${this.id}(GBS): Switching is possible`);
                    // if only one choice in switching then no need to continue
                    if (actions.length == 1) {
                        console.log(`>> ${this.id}(GBS): Only one option to switch`);
                        returnAction = _.sample(actions);
                        return returnAction;
                    }
                    // TODO: find out when switchactions can not be found in actions
                    // returnAction = _.sample(actions);
                    const indexInOwnTeam = this._getIndexInOwnTeam(switchToNameBest, info);
                    // search for correct switch action in actions object
                    for (const act of actions) {
                        if ((act.type === 'switch') && (act.pokeNum == (indexInOwnTeam))) {
                            console.log(`>> ${this.id}(GBS): Switchaction index ${indexInOwnTeam}`);
                            returnAction = act;
                            console.log(`>> ${this.id}(GBS): Switching to ${switchToNameBest}`);
                            break;
                        }
                    }
                } else {
                    console.log(`>> ${this.id}(GBS): Switching not possible, move not possible`);
                }
            }
        } else {
            // better check found than active, switch to switchToName
            console.log(`>> ${this.id}(GBS): switching to ${switchToNameBest}`);
            const switchIsPossible = this._actionTypePossible(actions, 'switch');
            if (switchIsPossible) {
                console.log(`>> ${this.id}(GBS): Switching is possible`);
                // if only one choice in switching then no need to continue
                if (actions.length == 1) {
                    console.log(`>> ${this.id}(GBS): Only one option to switch`);
                    returnAction = _.sample(actions);
                    return returnAction;
                }
                // TODO: find out when switchactions can not be found in actions
                // returnAction = _.sample(actions);
                const indexInOwnTeam = this._getIndexInOwnTeam(switchToNameBest, info);
                // search for correct switch action in actions object
                for (const act of actions) {
                    if ((act.type === 'switch') && (act.pokeNum == (indexInOwnTeam))) {
                        console.log(`>> ${this.id}(GBS): Switchaction index ${indexInOwnTeam}`);
                        returnAction = act;
                        console.log(`>> ${this.id}(GBS): switching to ${switchToNameBest}`);
                        break;
                    }
                }
            } else {
                console.log(`>> ${this.id}(GBS): Switching not possible`);
            }
        }
        return returnAction;
    }

    /**
     * calculates the best switch possible in current turn
     * when only one switch option possible in actions (length==1). this function returns it
     *
     * @param {battle} battle
     * @param {actions} actions
     * @param {info} info
     * @param {int} activeMatchup current matchup Value of myActiveMon vs. oppActiveMon
     * @param {string} myActiveMon
     * @param {string} oppActiveMon
     * @return {action} if null, it signals to caller that no switch shall be done
     */
    _typeGetBestSwitch(battle, actions, info, activeMatchup, myActiveMon, oppActiveMon) {
        let returnAction = null;
        // check if bigger value exists in matchupMatrix compared to activeMatchup
        // look at opposing mon's column and determine max
        // TODO: integrate static max for every column into MUMatrix, maybe in a MUMatrix object
        // TODO: but current code makes fainted-skips easier

        // maximum Matchup Value in column of oppActiveMon in MUMatrix, active and fainted excluded
        let maxMatchupValue = -2;
        let currentMatchupValue;
        // index of oppMon in MUMatrix
        const oppMonIndex = this._oppMonsKeys[oppActiveMon];
        // let switchToName;
        let switchToNameBest;
        let switchToNameBestOld;
        let oldMax;
        for (let i = 0; i < 6; i++) {
            currentMatchupValue = this._typesMatchupMatrix[i][oppMonIndex];
            if (currentMatchupValue > maxMatchupValue) {
                oldMax = maxMatchupValue;
                maxMatchupValue = currentMatchupValue;
                switchToNameBestOld = switchToNameBest;
                switchToNameBest = this._myMonsList[i];
                if (this._isFainted(this._myMonsList[i], info)) {
                    console.log(`>> ${this.id}(TBS): ${this._myMonsList[i]} fainted`);
                    maxMatchupValue = oldMax;
                    switchToNameBest = switchToNameBestOld;
                }
                if (this._isActive(this._myMonsList[i], info)) {
                    console.log(`>> ${this.id}(TBS): ${this._myMonsList[i]} is already active`);
                    maxMatchupValue = oldMax;
                    switchToNameBest = switchToNameBestOld;
                    // console.log(`>> ${this.id}(GBS): Next best switch is ${switchToNameBest}`);
                }
            }
        }
        console.log(`>> ${this.id}(TBS): activeMatchup ${activeMatchup}, `
          + `maxMatchupValue ${maxMatchupValue}`);
        console.log(`>> ${this.id}(TBS): Besides staying in, `
          + `best switch would be ${switchToNameBest}`);

        if (maxMatchupValue <= activeMatchup) {
            // don't switch, a best check already active
            console.log(`>> ${this.id}(TBS): A best check already active`);
            // if no moveactions possible, recommend switch anyway with a best switch
            const moveIsPossible = this._actionTypePossible(actions, 'move');
            if (!moveIsPossible) {
                console.log(`>> ${this.id}(TBS): No move is possible, recommend switch anyway.`);
                const switchIsPossible = this._actionTypePossible(actions, 'switch');
                if (switchIsPossible) {
                    console.log(`>> ${this.id}(TBS): Switching is possible`);
                    // if only one choice in switching then no need to continue
                    if (actions.length == 1) {
                        console.log(`>> ${this.id}(TBS): Only one option to switch`);
                        returnAction = _.sample(actions);
                        return returnAction;
                    }
                    // TODO: find out when switchactions can not be found in actions
                    // returnAction = _.sample(actions);
                    const indexInOwnTeam = this._getIndexInOwnTeam(switchToNameBest, info);
                    // search for correct switch action in actions object
                    for (const act of actions) {
                        if ((act.type === 'switch') && (act.pokeNum == (indexInOwnTeam))) {
                            console.log(`>> ${this.id}(TBS): Switchaction index ${indexInOwnTeam}`);
                            returnAction = act;
                            console.log(`>> ${this.id}(TBS): Switching to ${switchToNameBest}`);
                            break;
                        }
                    }
                } else {
                    console.log(`>> ${this.id}(TBS): Switching not possible, move not possible`);
                }
            }
        } else {
            // better check found than active, switch to switchToName
            console.log(`>> ${this.id}(TBS): switching to ${switchToNameBest}`);
            const switchIsPossible = this._actionTypePossible(actions, 'switch');
            if (switchIsPossible) {
                console.log(`>> ${this.id}(TBS): Switching is possible`);
                // if only one choice in switching then no need to continue
                if (actions.length == 1) {
                    console.log(`>> ${this.id}(TBS): Only one option to switch`);
                    returnAction = _.sample(actions);
                    return returnAction;
                }
                // TODO: find out when switchactions can not be found in actions
                // returnAction = _.sample(actions);
                const indexInOwnTeam = this._getIndexInOwnTeam(switchToNameBest, info);
                // search for correct switch action in actions object
                for (const act of actions) {
                    if ((act.type === 'switch') && (act.pokeNum == (indexInOwnTeam))) {
                        console.log(`>> ${this.id}(TBS): Switchaction index ${indexInOwnTeam}`);
                        returnAction = act;
                        console.log(`>> ${this.id}(TBS): switching to ${switchToNameBest}`);
                        break;
                    }
                }
            } else {
                console.log(`>> ${this.id}(TBS): Switching not possible`);
            }
        }
        return returnAction;
    }

    /**
     * gets the index of the pokemon in own pokemon list for switching
     *
     * @param {string} switchTo pokemon name, to switch to
     * @param {info} info
     * @return {int}
     */
    _getIndexInOwnTeam(switchTo, info) {
        // keeps current pokemon during iterating our teamlist
        let currentPokemon;
        let idx = 0;
        // index of the pokemon we should switch to (in own pokemon list)
        let indexInTeam = 0;
        // check if we have xsi to the opponent's active pokemon in own team
        for (const pokemon of info.side.pokemon) {
            // we want to switch, skip the own active pokemon
            if (!pokemon.active) {
                currentPokemon = this._normName(pokemon.details);
                if (switchTo === currentPokemon) {
                    indexInTeam = idx;
                    break;
                }
            }
            idx++;
        }
        return indexInTeam+1;
    }

    /**
     * teamPreview computations (and choosing lead later)
     *
     * @param {info} info
     * @param {battle} battle
     */
    _handleTeamPreview(info, battle) {
        this._myMonsList = new Array(6);
        let arrayIndex = 0;
        for (const pokemon of info.side.pokemon) {
            this._myMonsList[arrayIndex] = this._normName(pokemon.details);
            arrayIndex++;
        }
        // get list of opposing pokemon
        let oppMons;
        if (this.id === 'p1') {
            oppMons = battle.sides[1].pokemon;
        } else {
            oppMons = battle.sides[0].pokemon;
        }

        this._oppMonsList = new Array(6);
        arrayIndex = 0;
        for (const pokemon of oppMons) {
            this._oppMonsList[arrayIndex] = this._normName(pokemon.details);
            arrayIndex++;
        }
        console.log(`>> ${this.id}: My team: ${this._myMonsList}`);
        console.log(`>> ${this.id}: My opponents team: ${this._oppMonsList}`);

        //              mon1 mon2 mon3 ...(opponent)
        // mon 1      |
        // mon 2      |
        // (own mons) |

        // set keys. "slowbro" : 0
        this._myMonsKeys = {
            [this._myMonsList[0]]: 0,
            [this._myMonsList[1]]: 1,
            [this._myMonsList[2]]: 2,
            [this._myMonsList[3]]: 3,
            [this._myMonsList[4]]: 4,
            [this._myMonsList[5]]: 5,
        };

        this._oppMonsKeys = {
            [this._oppMonsList[0]]: 0,
            [this._oppMonsList[1]]: 1,
            [this._oppMonsList[2]]: 2,
            [this._oppMonsList[3]]: 3,
            [this._oppMonsList[4]]: 4,
            [this._oppMonsList[5]]: 5,
        };
        // console.log(oppMonsKeys);
        // console.log(myMonsKeys);

        // calculate the xsiMatchupMatrix
        // for all pokemon in the opposing team
        // determine whether it is gsi, ssi, nsi, or na
        // insert 3, 2, 1, or 0 in matchupMatrix
        // columns i (oppMons), rows j (myMons)
        this._xsiMatchupMatrix = new Array(6);
        for (let i = 0; i < this._xsiMatchupMatrix.length; i++) {
            this._xsiMatchupMatrix[i] = new Array(6);
        }
        let oppMonW;
        for (let i = 0; i < 6; i++) {
            oppMonW = this._oppMonsList[i];
            for (let j = 0; j < 6; j++) {
                // console.log(`>> ${this.id}: Search in ${oppMonW} for ${myMonsList[j]}`);
                this._xsiMatchupMatrix[j][i] =
                 this._xsiMatchupValue(oppMonW, this._myMonsList[j]);
                // console.log(`>> ${this.id}: ${xsiMatchupMatrix[j][i]}`);
            }
        }

        // calculate the typesMatchupMatrix
        this._typesMatchupMatrix = new Array(6);
        for (let i = 0; i < this._typesMatchupMatrix.length; i++) {
            this._typesMatchupMatrix[i] = new Array(6);
        }
        for (let i = 0; i < 6; i++) {
            oppMonW = this._oppMonsList[i];
            for (let j = 0; j < 6; j++) {
                // console.log(`>> ${this.id}: Search in ${oppMonW} for ${myMonsList[j]}`);
                this._typesMatchupMatrix[j][i] =
                 this._typesMatchupValue(oppMonW, this._myMonsList[j]);
                // console.log(`>> ${this.id}: ${xsiMatchupMatrix[j][i]}`);
            }
        }

        // for all missing values (-1) in xsi matchup matrix, take values from typeMUMatrix
        // normalize values in typesMatchupMatrix to 0-3 as well
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                // to convert from typeMatrix to checksmatrix do: (8-value)*(3/8)
                this._typesMatchupMatrix[i][j] = (8-this._typesMatchupMatrix[i][j])*(0.375);
                if (this._xsiMatchupMatrix[i][j] == -1) {
                    this._xsiMatchupMatrix[i][j] = this._typesMatchupMatrix[i][j];
                }
            }
        }
        console.log(`>> ${this.id}: xsiMatchupMatrix`);
        console.log(this._xsiMatchupMatrix);
        console.log(`>> ${this.id}: typesMatchupMatrix`);
        console.log(this._typesMatchupMatrix);

        // TODO: calc most threatening mon based on checks and type + the opponnents.
    }

    /**
     * returns the current matchup value based on the checksgraph
     *
     * @param {int} matchupValue
     * @return {string}
     */
    _matchUpValueToXsi(matchupValue) {
        let xsi;
        switch (matchupValue) {
        case 3:
            xsi = 'gsi';
            break;
        case 2:
            xsi = 'ssi';
            break;
        case 1:
            xsi = 'nsi';
            break;
        case 0:
            xsi = 'na';
            break;
        default:
            console.log('Wrong matchupValue');
        }
        return xsi;
    }

    /**
     * returns the current matchup value based on the checksgraph
     *
     * @param {string} myMon
     * @param {string} oppMon
     * @return {float}
     */
    _xsilookUpInMatchupMatrix(myMon, oppMon) {
        return this._xsiMatchupMatrix[this._myMonsKeys[myMon]][this._oppMonsKeys[oppMon]];
    }

    /**
     * returns the current matchup value based on the typesgraph
     *
     * @param {string} myMon
     * @param {string} oppMon
     * @return {float}
     */
    _typeslookUpInMatchupMatrix(myMon, oppMon) {
        return this._typesMatchupMatrix[this._myMonsKeys[myMon]][this._oppMonsKeys[oppMon]];
    }

    /**
     * returns whether the pokemon is active or not
     * in own team
     *
     * @param {string} isActiveMon the pokemon of which we want to know if it is active
     * @param {info} info
     * @return {bool}
     */
    _isActive(isActiveMon, info) {
        let currentPokemon;
        let isActive = false;
        for (const pokemon of info.side.pokemon) {
            currentPokemon = this._normName(pokemon.details);
            if ((isActiveMon === currentPokemon) && (pokemon.active == true)) {
                isActive = true;
                break;
            }
        }
        return isActive;
    }

    /**
     * returns whether the pokemon is fainted or not
     * in own team
     *
     * @param {string} faintedMon
     * @param {info} info
     * @return {bool}
     */
    _isFainted(faintedMon, info) {
        let currentPokemon;
        let isFainted = false;
        for (const pokemon of info.side.pokemon) {
            currentPokemon = this._normName(pokemon.details);
            // condition[0] === '0'
            if ((faintedMon === currentPokemon) && (pokemon.condition === '0 fnt')) {
                isFainted = true;
                break;
            }
        }
        return isFainted;
    }

    /**
     * used to convert pokemon names in an internal standard format
     * returns the normalized pokemon name
     *
     * @param {string} pokemon
     * @return {string}
     */
    _normName(pokemon) {
        // lower case and remove spaces
        let myMon = pokemon.toLowerCase().replace(/\s/g, '');
        // remove all "-" (tapu-koko)
        myMon = myMon.replace(/-/, '');
        // remove "," and everything after that (landorustherian, M)
        myMon = myMon.split(',')[0];

        return myMon;
    }

    /**
     * return whether the action specified in actionType is present in the actions object
     *
     * @param {actions} actions
     * @param {string} actionType
     * @return {bool}
     */
    _actionTypePossible(actions, actionType) {
        let actionPossible = false;
        for (const acts of actions) {
            if (acts.type === actionType) {
                actionPossible = true;
                break;
            }
        }
        return actionPossible;
    }

    /**
     * Used to generate xsimatchupMatrix entries
     * Returns the matchup value for two specified pokemon
     * Determine whether it is gsi, ssi, nsi, or na
     * We check in pokemonWithList's list what type of check pokemonInList is to it
     *
     * @param {string} pokemonWithList
     * @param {string} pokemonInList
     * @return {int}
     */
    _xsiMatchupValue(pokemonWithList, pokemonInList) {
        let matchupValue;
        let xsiIndex;
        const xsiLists = checks[pokemonWithList];

        if (xsiLists) {
            // check in gsi
            xsiIndex = xsiLists.gsi.indexOf(pokemonInList);
            if (xsiIndex > -1) {
                // found gsi
                matchupValue = 3;
                return matchupValue;
            }
            // check ssi
            xsiIndex = xsiLists.ssi.indexOf(pokemonInList);
            if (xsiIndex > -1) {
                // found ssi
                matchupValue = 2;
                return matchupValue;
            }
            // check nsi
            xsiIndex = xsiLists.nsi.indexOf(pokemonInList);
            if (xsiIndex > -1) {
                // found nsi
                matchupValue = 1;
                return matchupValue;
            } else {
                // pokemon cannot be found in lists, it is set to na
                matchupValue = 0;
            }
        } else {
            // pokemon not found in the checksgraph, xsiLists is null
            matchupValue = -1;
        }
        return matchupValue;
    }

    /**
     * Used to generate typesmatchupMatrix entries
     * provides answer to: how well does myMon do against oppMon in terms of type
     * Returns the matchup value for two specified pokemon
     *
     * @param {string} myMon
     * @param {string} oppMon
     * @return {int}
     */
    _typesMatchupValue(myMon, oppMon) {
        let matchupValue = 0;
        // get types of both pokemon from pokedex
        let myMonTypes = BattlePokedex[myMon].types;
        let oppMonTypes = BattlePokedex[oppMon].types;

        // dublicate types of mons with only one type
        if (myMonTypes.length == 1) {
            myMonTypes = [myMonTypes[0], myMonTypes[0]];
        }

        if (oppMonTypes.length == 1) {
            oppMonTypes = [oppMonTypes[0], oppMonTypes[0]];
        }

        // console.log(`${myMon}: ${myMonTypes}`);
        // console.log(`${oppMon}: ${oppMonTypes}`);
        let currentOppMonType;
        let currentMyMonType;
        let currentTypeVal;
        for (let i = 0; i < 2; i++) {
            currentOppMonType = oppMonTypes[i];
            for (let j = 0; j < 2; j++) {
                currentMyMonType = myMonTypes[j];
                currentTypeVal = BattleTypeChart[currentOppMonType].damageTaken[currentMyMonType];
                matchupValue += this._getMappedTypeValue(currentTypeVal);
                // console.log(`${currentMyMonType} -> ${currentOppMonType}:`
                //    + `${this._getMappedTypeValue(currentTypeVal)}`);
            }
        }
        return matchupValue;
    }

    /**
     * return mapped typeValue
     * // 0 -> 1, 1 -> 2, 2 -> 1/2, and 3 -> 0
     *
     * @param {int} typeValue
     * @return {int}
     */
    _getMappedTypeValue(typeValue) {
        let mappedTypeValue;
        switch (typeValue) {
        case 0:
            mappedTypeValue = 1;
            break;
        case 1:
            mappedTypeValue = 2;
            break;
        case 2:
            mappedTypeValue = 0.5;
            break;
        case 3:
            mappedTypeValue = 0;
            break;
        default:
            console.log('Error in _getMappedTypeValue');
        }
        return mappedTypeValue;
    }

    /**
     * returns xsi (gsi or ssi or nsi) data
     *
     * @param {info} info
     * @param {string[]} oppMonChecks //.xsi, array which should be searched
     * @return {[]}
     */
    _inXsi(info, oppMonChecks) {
        // keeps current pokemon during iterating our teamlist
        let currentPokemon;
        // whether we have a xsi in the team
        let xsiExists = false;
        // the xsi pokemon's index in oppActiveMon's xsi list
        let xsiIndex;
        // pokemon name (to which we should switch)
        let xsiName;
        // index of the pokemon we should switch to (in own pokemon list)
        let xsiIndexInTeam = 0;
        // check if we have xsi to the opponent's active pokemon in own team
        for (const pokemon of info.side.pokemon) {
            // we want to switch, so skip the own active pokemon
            if (!pokemon.active) {
                currentPokemon = this._normName(pokemon.details);
                // check if currentPokemon appears in oppActiveMon's xsi list
                if (oppMonChecks) {
                    xsiIndex = oppMonChecks.indexOf(currentPokemon);
                    if (xsiIndex > -1) {
                        xsiExists = true;
                        xsiName = oppMonChecks[xsiIndex];
                        // found xsi, exit loop
                        break;
                    }
                }
            }
            xsiIndexInTeam++;
        }
        return [xsiExists, xsiName, xsiIndexInTeam];
    }
}

module.exports = ChecksSwitchAgent;
