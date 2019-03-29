const encode = require('./one-hot-encoding');

/**
 * Encode an action into a one hot encoding of this action that can be used by rl algorithms
 *
 * The one hot encoding is structured in the following way
 * [move1, move2, move3, move4,
 *  switch1, switch2, switch3, switch4, switch5, switch6,
 *  mega-evolve, use z-move]
 *
 * @param {Action} action
 * @param {number} teamSize
 * @return {number[]}
 */
function encodeActions(action, teamSize = 6) {
    let megaEvolve = 0;
    let zMove = 0;
    let encodedAction = [];
    if (action.type === 'move') {
        encodedAction = encodedAction.concat(encode.createOneHotEncoding(action.moveNum - 1, 4));
        megaEvolve = action.mega;
        zMove = action.zmove;
    } else {
        encodedAction = encodedAction.concat(new Array(4).fill(0));
    }
    if (action.type === 'switch') {
        encodedAction = encodedAction.concat(
            encode.createOneHotEncoding(action.pokeNum - 1, teamSize)
        );
    } else {
        encodedAction = encodedAction.concat(new Array(teamSize).fill(0));
    }
    encodedAction = encodedAction.concat([megaEvolve, zMove]);

    return encodedAction;
}

module.exports = {
    encodeActions,
};
