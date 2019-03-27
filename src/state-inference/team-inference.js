'use strict';

/**
 * @param {Array} observedTeam
 * @return {string}
 */
function assumeTeamWithUniformStats(observedTeam) {
    const assumedTeam = [];
    for (let i = 0; i < observedTeam.length; i++) {
        assumedTeam[i] = {
            name: observedTeam[i].name,
            species: observedTeam[i].species,
            item: '',
            ability: 0,
            moves: ['splash'],
            nature: 'Quirky',
            evs: {
                hp: 85,
                atk: 85,
                def: 85,
                spa: 85,
                spd: 85,
                spe: 85,
            },
            ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31},
            gender: 'female',
            shiny: false,
            level: 100,
            happiness: 0,
            hpType: 'fire',
            pokeball: 'pokeball',
        };
    }
    return assumedTeam;
}

module.exports = {
    assumeTeamWithUniformStats: assumeTeamWithUniformStats,
};
