'use strict';

const Tools = require('../src/tracking/battle-dex');

/**
 * Convert a team from packed string format to an object.
 *
 * @param {string} buf
 * @return {Object}
 */
function unpackTeam(buf) {
    if (!buf) return [];

    const team = [];
    let i = 0;
    let j;

    while (true) {
        const set = {};
        team.push(set);

        // name
        j = buf.indexOf('|', i);
        set.name = buf.substring(i, j);
        i = j + 1;

        // species
        j = buf.indexOf('|', i);
        set.species = Tools.getTemplate(buf.substring(i, j)).species || set.name;
        i = j + 1;

        // item
        j = buf.indexOf('|', i);
        set.item = Tools.getItem(buf.substring(i, j)).name;
        i = j + 1;

        // ability
        j = buf.indexOf('|', i);
        const ability = Tools.getAbility(buf.substring(i, j)).name;
        const template = Tools.getTemplate(set.species);
        set.ability = (template.abilities && ability in {
            '': 1,
            '0': 1,
            '1': 1,
            'H': 1,
        } ? template.abilities[ability || '0'] : ability);
        i = j + 1;

        // moves
        j = buf.indexOf('|', i);
        set.moves = buf.substring(i, j).split(',').map(
            function(moveid) {
                return Tools.getMove(moveid).name;
            }
        );
        i = j + 1;

        // nature
        j = buf.indexOf('|', i);
        set.nature = buf.substring(i, j);
        if (set.nature === 'undefined') set.nature = undefined;
        i = j + 1;

        // evs
        j = buf.indexOf('|', i);
        if (j !== i) {
            const evstring = buf.substring(i, j);
            if (evstring.length > 5) {
                const evs = evstring.split(',');
                set.evs = {
                    hp: Number(evs[0]) || 0,
                    atk: Number(evs[1]) || 0,
                    def: Number(evs[2]) || 0,
                    spa: Number(evs[3]) || 0,
                    spd: Number(evs[4]) || 0,
                    spe: Number(evs[5]) || 0,
                };
            } else if (evstring === '0') {
                set.evs = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0};
            }
        }
        i = j + 1;

        // gender
        j = buf.indexOf('|', i);
        if (i !== j) set.gender = buf.substring(i, j);
        i = j + 1;

        // ivs
        j = buf.indexOf('|', i);
        if (j !== i) {
            const ivs = buf.substring(i, j).split(',');
            set.ivs = {
                hp: ivs[0] === '' ? 31 : Number(ivs[0]),
                atk: ivs[1] === '' ? 31 : Number(ivs[1]),
                def: ivs[2] === '' ? 31 : Number(ivs[2]),
                spa: ivs[3] === '' ? 31 : Number(ivs[3]),
                spd: ivs[4] === '' ? 31 : Number(ivs[4]),
                spe: ivs[5] === '' ? 31 : Number(ivs[5]),
            };
        }
        i = j + 1;

        // shiny
        j = buf.indexOf('|', i);
        if (i !== j) set.shiny = true;
        i = j + 1;

        // level
        j = buf.indexOf('|', i);
        if (i !== j) set.level = parseInt(buf.substring(i, j), 10);
        i = j + 1;

        // happiness
        j = buf.indexOf(']', i);
        let misc = undefined;
        if (j < 0) {
            if (i < buf.length) misc = buf.substring(i).split(',', 3);
        } else {
            if (i !== j) misc = buf.substring(i, j).split(',', 3);
        }
        if (misc) {
            set.happiness = (misc[0] ? Number(misc[0]) : 255);
            set.hpType = misc[1];
            set.pokeball = misc[2];
        }
        if (j < 0) break;
        i = j + 1;
    }

    return team;
}

module.exports = {unpackTeam};
