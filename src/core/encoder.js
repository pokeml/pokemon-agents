'use strict';

const _ = require('underscore');

/**
 * @typedef {Object} Vocab
 * @property {?Array} pokemon
 * @property {?Array} move
 * @property {?Array} ability
 * @property {?Array} item
 * @property {?Array} sideCondition
 * @property {?Array} weather
 * @property {?Array} pseudoWeather
 */

/**
 * An encoder that converts game states to fixed-size numeric vectors.
 */
class Encoder {
    /**
     * @param {Vocab} [vocab]
     * @param {string} [tier]
     */
    constructor(vocab, tier) {
        this.tier = tier;
        this.dictIds = [
            'pokemon', 'move', 'ability', 'item', 'sideCondition', 'weather', 'pseudoWeather',
        ];
        this.dict = {};
        for (const id of this.dictIds) {
            this.dict[id] = (id in vocab) ? this._createDict(vocab[id]) : this._loadDict(id, tier);
        }
    }

    /**
     * Create an ordered mapping from each element of the given array to its index.
     *
     * @param {Array} arr
     * @return {Map}
     */
    _createDict(arr) {
        if (!arr.every((element) => typeof element === 'string')) {
            throw new Error('Array must only contain strings');
        }
        const uArr = _.uniq(arr);
        const map = new Map();
        for (let i = 0; i < uArr.length; i++) {
            map.set(uArr[i], i);
        }
        return map;
    };

    /**
     * Load a default dictionary.
     *
     * @param {string} id
     * @return {Object}
     */
    _loadDict(id) {
        return null;
    }

    /**
     * Create a single feature map from a set of features, each of some respective type.
     *
     * If the type is 'number', the feature is expected to be a number and will be added to the
     * vector as is. Otherwise, the type must be a valid dictId (see this.dictIds), in which case
     * value has to be either a valid value of that type or an array of valid values of that types.
     *
     * The features in the resulting map are ordered in the same way as they are in the given
     * array.
     *
     * @param {Array} features - Each element has the form [name, type, value]. Each name must be
     *     unique.
     * @return {Map} - Each key has the form "name" for numeric features and "name:category" for
     *     categorical features. Each corresponding value is the encoding of the given value.
     */
    encode(features) {
        const map = new Map();
        for (const [name, type, value] of features) {
            if (type === 'number') {
                map.set(name, value);
            } else {
                if (value instanceof Array) {
                    for (const [index, val] of value.entries()) {
                        for (const [key, encoding] of this._oneHot(type, val).entries()) {
                            map.set(`${name}[${index}]:${key}`, encoding);
                        }
                    }
                } else {
                    for (const [key, encoding] of this._oneHot(type, value).entries()) {
                        map.set(`${name}:${key}`, encoding);
                    }
                }
            }
        }
        return map;
    }

    /**
     * Encode a categorical entity of some type.
     *
     * If the entity is null or undefined, all entries will be zero.
     *
     * @param {string} type
     * @param {string} value
     * @param {number} onValue
     * @param {number} offValue
     * @return {Map}
     */
    _oneHot(type, value, onValue = 1, offValue = 0) {
        if (type == null || !(this.dictIds.includes(type))) {
            throw new Error(`Invalid type: ${type}`);
        }
        if (value != null && !(this.dict[type].has(value))) {
            throw new Error(`Invalid value ${value} for type ${type}`);
        }
        const map = new Map();
        for (const category of this.dict[type].keys()) {
            map.set(category, offValue);
        }
        if (value != null) {
            map.set(value, onValue);
        }
        return map;
    }

    /**
     * Get the entity to index mapping for a dictionary of some type.
     *
     * @param {string} type
     * @return {Object}
     */
    getDictionary(type) {
        return this.dict[type];
    }

    /**
     * Get the index of a given entity in a specified dictionary.
     *
     * @param {string} type
     * @param {string} value
     * @return {number}
     */
    _index(type, value) {
        if (value == null || !(value in this.dict[type])) {
            throw new Error(`Entity ${value} not in dictionary ${type}`);
        }

        return this.dict[type].get(value);
    }
}

module.exports = Encoder;
