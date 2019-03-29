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

function packTeam(team) {
    let buf = '';
    if (!team) return '';

    let hasHP;
    for (let i = 0; i < team.length; i++) {
        let set = team[i];
        if (buf) buf += ']';

        // name
        buf += set.name;

        // species
        let id = toId(set.species);
        buf += '|' + (toId(set.name) === id ? '' : id);

        // item
        buf += '|' + toId(set.item);

        // ability
        let template = Tools.getTemplate(set.species || set.name);
        let abilities = template.abilities;
        id = toId(set.ability);
        if (abilities) {
            if (id === toId(abilities['0'])) {
                buf += '|';
            } else if (id === toId(abilities['1'])) {
                buf += '|1';
            } else if (id === toId(abilities['H'])) {
                buf += '|H';
            } else {
                buf += '|' + id;
            }
        } else {
            buf += '|' + id;
        }

        // moves
        buf += '|';
        if (set.moves) for (let j = 0; j < set.moves.length; j++) {
            let moveid = toId(set.moves[j]);
            if (j && !moveid) continue;
            buf += (j ? ',' : '') + moveid;
            if (moveid.substr(0, 11) === 'hiddenpower' && moveid.length > 11) hasHP = true;
        }

        // nature
        buf += '|' + (set.nature || '');

        // evs
        let evs = '|';
        if (set.evs) {
            evs = '|' + (set.evs['hp'] || '') + ',' + (set.evs['atk'] || '') + ',' + (set.evs['def'] || '') + ',' + (set.evs['spa'] || '') + ',' + (set.evs['spd'] || '') + ',' + (set.evs['spe'] || '');
        }
        if (evs === '|,,,,,') {
            buf += '|';
            // doing it this way means packTeam doesn't need to be past-gen aware
            if (set.evs['hp'] === 0) buf += '0';
        } else {
            buf += evs;
        }

        // gender
        if (set.gender && set.gender !== template.gender) {
            buf += '|' + set.gender;
        } else {
            buf += '|';
        }

        // ivs
        let ivs = '|';
        if (set.ivs) {
            ivs = '|' + (set.ivs['hp'] === 31 || set.ivs['hp'] === undefined ? '' : set.ivs['hp']) + ',' + (set.ivs['atk'] === 31 || set.ivs['atk'] === undefined ? '' : set.ivs['atk']) + ',' + (set.ivs['def'] === 31 || set.ivs['def'] === undefined ? '' : set.ivs['def']) + ',' + (set.ivs['spa'] === 31 || set.ivs['spa'] === undefined ? '' : set.ivs['spa']) + ',' + (set.ivs['spd'] === 31 || set.ivs['spd'] === undefined ? '' : set.ivs['spd']) + ',' + (set.ivs['spe'] === 31 || set.ivs['spe'] === undefined ? '' : set.ivs['spe']);
        }
        if (ivs === '|,,,,,') {
            buf += '|';
        } else {
            buf += ivs;
        }

        // shiny
        if (set.shiny) {
            buf += '|S';
        } else {
            buf += '|';
        }

        // level
        if (set.level && set.level !== 100) {
            buf += '|' + set.level;
        } else {
            buf += '|';
        }

        // happiness
        if (set.happiness !== undefined && set.happiness !== 255) {
            buf += '|' + set.happiness;
        } else {
            buf += '|';
        }

        if (set.pokeball || (set.hpType && !hasHP)) {
            buf += ',' + (set.hpType || '');
            buf += ',' + toId(set.pokeball);
        }
    }

    return buf;
}

module.exports = {
    unpackTeam: unpackTeam,
    packTeam: packTeam
};
