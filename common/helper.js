// // Local database due to Discord not supporting API to see who has connected steam accounts.
// // This allows it so commands can be used like... !lastmatch fogell
// // Instead of using their DOTA ID any custom string will work
const playerData = require('../data/players.json');

function resultOfMatch(result) {
    if (result == true) {
        return 'Radiant';
    } else {
        return 'Dire';
    }
}

exports.resultOfMatch = resultOfMatch;

function resultOfLastMatch(result, playerslot) {
    if (((playerslot >> 7) & 1) === 0) {
        // Raidant 
        if (resultOfMatch(result) == 'Radiant') {
            return 'Won';
        } else {
            return 'Lost';
        }
    } else {
        // Dire
        if (resultOfMatch(result) == 'Dire') {
            return 'Won';
        } else {
            return 'Lost';
        }
    }
}

exports.resultOfLastMatch = resultOfLastMatch;

function playerLookup(id) {
    for (var name in playerData) {
        if (name.toString() == id) {
            return playerData[name].id;
        }
    }

    return '';
}

exports.playerLookup = playerLookup;

function findRankTier(rank_tier) {
    let rank = String(rank_tier);
    let result = '';

    if (rank_tier == 'null') {
        return 'unknown';
    }

    if (rank.charAt(0) == '1') {
        result += 'Herald';
    } else if (rank.charAt(0) == '2') {
        result += 'Guardian';
    } else if (rank.charAt(0) == '3') {
        result += 'Crusader';
    } else if (rank.charAt(0) == '4') {
        result += 'Archon';
    } else if (rank.charAt(0) == '5') {
        result += 'Legend';
    } else if (rank.charAt(0) == '6') {
        result += 'Ancient';
    } else if (rank.charAt(0) == '7') {
        result += 'Divine';
    }

    for (i = 0; i < 6; ++i) {
        if (rank.charAt(1) == i) {
            result += ' ';
            result += i;
        }
    }

    return result;
}

exports.findRankTier = findRankTier;

function findGameMode(game_mode) {
    if (game_mode == 1) {
        return 'All Pick';
    } else if (game_mode == 22) {
        return 'Ranked All Pick'; 
    } else if (game_mode == 3) {
        return 'Random Draft';
    } else if (game_mode == 4) {
        return 'Single Draft (Low prio)';
    } else if (game_mode == 5) {
        return 'All Random';
    } else if (game_mode == 7) {
        return 'Diretide';
    } else if (game_mode == 8) {
        return 'Reverse Captains Mode';
    } else if (game_mode == 9) {
        return 'Greeviling';
    } else if (game_mode == 10) {
        return 'Tutorial';
    } else if (game_mode == 11) {
        return 'Mid Only';
    } else if (game_mode == 12) {
        return 'Least Played';
    } else if (game_mode == 13) {
        return 'New Player Pool';
    } else if (game_mode == 14) {
        return 'Compendium Matchmaking';
    } else if (game_mode == 15) {
        return 'Custom';
    } else if (game_mode == 16) {
        return 'Captains Draft';
    } else if (game_mode == 17) {
        return 'Balanced Draft';
    } else if (game_mode == 18) {
        return 'Ability Draft';
    } else if (game_mode == 20) {
        return 'All Random Deathmatch';
    } else if (game_mode == 21) {
        return 'Solo Mid 1v1';
    } else if (game_mode == 2) {
        return 'Captains Mode';
    } else if (game_mode == 24) {
        return 'Mutation';
    } else if (game_mode == 23) {
        return 'Turbo';
    } else {
	    return 'Unknown';    
    }
}

exports.findGameMode = findGameMode;

function parsePrizePoolWebsite(data) {
    let index = data.indexOf('green header') + 14;
    let index2;
    let string = data.substring(index, index+40);
    
    for (let i = 0; i < 40; ++i) {
        if (string[i] == '<') {
            index2 = i;
            break;
        }
    }
    
    return string.substring(0, index2);
}

exports.parsePrizePoolWebsite = parsePrizePoolWebsite;