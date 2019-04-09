const encoding = require('../../src/encoding/action-encoding');
const PokemonEnvActions = require('pokemon-env/src/actions');


test(
    'test switch action decoding', () => {
        expect(encoding.decodeAction(12)).toEqual(
            new PokemonEnvActions.SwitchAction(1)
        );
    }
);

test(
    'test switch move decoding', () => {
        expect(encoding.decodeAction(2)).toEqual(
            new PokemonEnvActions.MoveAction(3, {mega: 0, zmove: 0})
        );
    }
);

test(
    'test switch move decoding mega', () => {
        expect(encoding.decodeAction(4)).toEqual(
            new PokemonEnvActions.MoveAction(1, {mega: 1, zmove: 0})
        );
    }
);

test(
    'test switch move decoding zmove', () => {
        expect(encoding.decodeAction(11)).toEqual(
            new PokemonEnvActions.MoveAction(4, {mega: 0, zmove: 1})
        );
    }
);
