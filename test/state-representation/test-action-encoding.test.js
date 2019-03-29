const encoding = require('../../src/encoding/action-encoding');
const PokemonEnvActions = require('pokemon-env/src/actions');


test(
    'test switch action encoding', () => {
        expect(
            encoding.encodeActions(new PokemonEnvActions.SwitchAction(1), 5)).toEqual(
            [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0]
        );
    }
);

test(
    'test move action encoding', () => {
        expect(
            encoding.encodeActions(
                new PokemonEnvActions.MoveAction(4, {mega: 0, zmove: 0}))
        ).toEqual(
            [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0]
        );
    }
);

test(
    'test move action mega evo encoding', () => {
        expect(
            encoding.encodeActions(
                new PokemonEnvActions.MoveAction(2, {mega: 1, zmove: 0}))
        ).toEqual(
            [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
        );
    }
);

test(
    'test move action zmove encoding', () => {
        expect(
            encoding.encodeActions(
                new PokemonEnvActions.MoveAction(1, {mega: 0, zmove: 1}))
        ).toEqual(
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]
        );
    }
);