const PokemonEnvActions = require('pokemon-env/src/actions');

/**
 * Decode action as returned from reinforcement learning algorithm into Action object
 * Mapping is this:
 *
 * 0:  move1
 * 1:  move2
 * 2:  move3,
 * 3:  move4,
 * 12: switch1,
 * 13: switch2:
 * 14: ...
 *
 * @param {int} actionIndex
 * @return {Action}
 */
function decodeAction(actionIndex) {
    if (actionIndex <= 3) {
        return new PokemonEnvActions.MoveAction(
            actionIndex + 1,
            {
                mega: 0,
                zmove: 0,
            }
        );
    } else {
        return new PokemonEnvActions.SwitchAction(
            actionIndex - 3,
        );
    }
}

module.exports = {
    decodeAction,
};
