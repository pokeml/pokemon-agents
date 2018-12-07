'use strict';

const loadDict = () => null;

/**
 * @typedef {Object} Dict
 * @property {?Object} pokemon
 * @property {?Object} move
 * @property {?Object} ability
 * @property {?Object} item
 * @property {?Object} sideCondition
 * @property {?Object} weather
 * @property {?Object} pseudoWeather
 */

/**
 * An encoder that converts game states to fixed-size numeric vectors.
 */
class Encoder {
    /**
     * @param {string} tier
     * @param {Dict} dict
     */
    constructor(tier, dict = {}) {
        this.tier = tier;
        this.dictIds = [
            'pokemon', 'move', 'ability', 'item', 'sideCondition', 'weather', 'pseudoWeather',
        ];
        this.dict = {};
        for (const id of this.dictIds) {
            this.dict = id in dict ? dict[id] : loadDict(id, tier);
        }
    }

    /**
     * @param {string} type
     * @param {string} item
     * @return {Array}
     */
    encode(type, item) {
        if (!(type in this.dictIds)) {
            throw new Error(`Invalid type: ${type}`);
        }
        return null;
    }
}

module.exports = Encoder;
