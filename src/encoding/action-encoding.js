const PokemonEnvActions = require('pokemon-env/src/actions');

/**
 * Decode action as returned from reinforcement learning algorithm into Action object
 * Mapping is this:
 *
 * 0:  move1
 * 1:  move2
 * 2:  move3,
 * 3:  move4,
 * 4:  move1 mega,
 * 5:  move2 mega,
 * 6:  move3 mega,
 * 7:  move4 mega,
 * 8:  move1 zmove,
 * 9:  move2 zmove,
 * 10: move3 zmove
 * 11: move4 zmove
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
    } else if (actionIndex <= 7) {
        return new PokemonEnvActions.MoveAction(
            actionIndex - 3,
            {
                mega: 1,
                zmove: 0,
            }
        );
    } else if (actionIndex <= 11) {
        return new PokemonEnvActions.MoveAction(
            actionIndex - 7,
            {
                mega: 0,
                zmove: 1,
            }
        );
    } else {
        return new PokemonEnvActions.SwitchAction(
            actionIndex - 11,
        );
    }
}

module.exports = {
    decodeAction,
};
