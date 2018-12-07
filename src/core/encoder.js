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
     * Get the index of a given entity in a specified dictionary.
     *
     * @param {string} type
     * @param {string} entity
     * @return {Array}
     */
    index(type, entity) {
        if (type == null || !(type in this.dictIds)) {
            throw new Error(`Invalid type: ${type}`);
        }
        if (!(type in this.dict)) {
            throw new Error(`No dictionary for type: ${type}`);
        }
        if (entity == null || !(entity in this.dict[type])) {
            throw new Error(`Invalid entity: ${entity}`);
        }
        return this.dict[type][entity];
    }
}

module.exports = Encoder;
