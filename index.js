const Discord = require('discord.js');
const client = new Discord.Client();
var request = require('request');

var info = ['NjYxOTQxNDc2NzcwNDg4MzI.DUg2sA.szQQxYoIeViB7xzBga-ZASGYEU', 'matt']
var channel = client.channels.get('348698341242306560');

var http = require('http');
var fs = require('fs');

var herodataJSON;

request('https://raw.githubusercontent.com/kronusme/dota2-api/master/data/heroes.json', function (error, response, body) {
    herodataJSON = JSON.parse(body);   
});

// LOCAL DATABASE
var database = [
    ['matt', '49604109'],
    ['fogell', '78019306'],
    ['aggressive', '384363192'],
    ['helper', '457659216'],
    ['psychiatric', '134235356'],
    ['ben', '80162306'],
    ['josh', '80688700'],
    ['joshALT', '223329215'],
    ['chup', '71220683'],
    ['jonko', '89100568'],
    ['ryan', '569142'],
    ['gar', '94210317'],
    ['jimson', '34483138']
];

function appendURL(url1, id, url2) {
    return url1.concat(id, url2);
}

function helpcommand(input, message) {
    if (message.content.startsWith('!help')) {
        message.channel.send('```Welcome to the dotabot created by Matthew Zegar. This bot gathers API data from "https://docs.opendota.com".\n \nCommands:\n!help - shows all commands \n!info <id> - displays info about the dota player \n!database - shows which names are present within the database \n!lastmatch <id> - displays info about the last match the user played \n!matches <id> - displays info about all the matches the user has played\n!match <matchid> - shows information about the match ```');
    }
}

function databasecommand(input, message) {
    if (message.content.startsWith('!database')) {
        for (i = 0; i < database.length; i++) {
            message.channel.send(database[i][0]);
        }
    }  
}

function dotabuff(input, message) {
    if (message.content.startsWith('!dotabuff')) {
        message.channel.send('https://www.dotabuff.com/');
    }     
}

function personnamevalid(num, data) {
        if (typeof data.players[num].personaname == 'undefined') {
            return 'Anonymous';
        } else {
            return data.players[num].personaname;
        } 
}

function infocommand(input, message) {
    if (message.content.startsWith('!info ')) {
        let id = lookupid(input.substring(6, (input.length)));
		let url = "http://api.opendota.com/api/players/";
        let finalurl = url.concat(id);
        
        request(finalurl, function (error, response, body) {
            let data = JSON.parse(body);
            if (data.error == 'Internal Server Error' || typeof data.profile == 'undefined') {
                message.channel.send('Error, invalid ID');
            } else {
                message.channel.send('```Name: ' + data.profile.personaname + '\nRank: ' + rankcalc(data.rank_tier)  + '\nCompetitive rank: ' + data.competitive_rank + '\nMMR estimate: ' + data.mmr_estimate.estimate + '```', {files: [data.profile.avatarmedium]});
            }
        }); 
    }
}

function lastmatchcommand(input, message) {
    if (message.content.startsWith('!lastmatch ')) {
        let id = lookupid(input.substring(11, (input.length)));
		let url = "http://api.opendota.com/api/players/";
        let finalurl = url.concat(id, '/recentMatches');   

        request(finalurl, function (error, response, body) {
            let data = JSON.parse(body);
            if (typeof data[0] == 'undefined') {
                message.channel.send('Error, invalid ID');
            } else {
                request('https://raw.githubusercontent.com/kronusme/dota2-api/master/data/heroes.json', function (error, response, body) {
                    var herodata = JSON.parse(body);
                    for (i = 0; i < 112; ++i) {
                        if (data[0].hero_id == herodata.heroes[i].id) {
                            var hero = herodata.heroes[i].localized_name;
                        }
                    }
                    message.channel.send('https://www.dotabuff.com/matches/' + data[0].match_id);
                    message.channel.send('```\nGamemode: ' + gamemode(data[0].game_mode) + '\nHero: ' + hero + '\nDuration: ' + Math.round(data[0].duration/60) + ' mins' + '\nLast hits: ' + data[0].last_hits + '\nKills: ' + data[0].kills + '\nAssists: ' + data[0].assists  + '\nDeaths: ' + data[0].deaths + '\nGPM: ' + data[0].gold_per_min + '\nXPM: ' + data[0].xp_per_min + '\nTower damage: ' + data[0].tower_damage + '```');
                }); 
            }
        }); 

    }
}

function matchescommand(input, message) {
    if (message.content.startsWith('!matches ')) {
        let id = lookupid(input.substring(9, (input.length)));
        let url = "https://api.opendota.com/api/players/";
        let finalurl = url.concat(id, '/counts');   

        request(finalurl, function (error, response, body) {
            let data = JSON.parse(body);
            if (typeof data.leaver_status[0] == 'undefined') {
                message.channel.send('Error, invalid ID');
            } else {
                message.channel.send('```Total matches completed: ' + data.leaver_status[0].games + '\nWins: ' + data.leaver_status[0].win + '\nLosses: ' + (data.leaver_status[0].games - data.leaver_status[0].win) + '\nWon %: ' + Math.round((data.leaver_status[0].win / data.leaver_status[0].games)*100) +'```');
            }
        }); 
    }
}

function matchcommand(input, message, herodataJSON) {
    if (message.content.startsWith('!match ')) {
        let id = lookupid(input.substring(7, (input.length)));
        let url = "https://api.opendota.com/api/matches/";
        let finalurl = url.concat(id);   

        request(finalurl, function (error, response, body) {
            let data = JSON.parse(body);
            if (data.error == 'Internal Server Error' || typeof data.players == 'undefined') {
                message.channel.send('Error, invalid ID');
            } else {
                message.channel.send('```Match id: ' + data.match_id + '\nDuration: ' + Math.round(data.duration/60) + ' mins' + '\nWinner: ' + winner(data.radiant_win) + '\n\n```');
                message.channel.send('``` RADIANT\n1:' + personnamevalid(0, data) + '\nRank:' + rankcalc(data.players[0].rank_tier) + '\nH:' + heroid(data.players[0].hero_id, herodataJSON) + '\nK:' + data.players[0].kills + '\nD:' + data.players[0].deaths + '\nA:' + data.players[0].assists + '\nLH/D:' + data.players[0].last_hits + '/' + data.players[0].denies + '\nTWR:' + data.players[0].tower_damage + '\n\n2:' + personnamevalid(1, data) + '\nRank:' + rankcalc(data.players[1].rank_tier)  + '\nH:' + heroid(data.players[1].hero_id, herodataJSON) + '\nK:' + data.players[1].kills + '\nD:' + data.players[1].deaths + '\nA:' + data.players[1].assists + '\nLH/D:' + data.players[1].last_hits + '/' + data.players[1].denies + '\nTWR:' + data.players[1].tower_damage + '\n\n' + '3:' + personnamevalid(2, data) + '\nRank: ' + rankcalc(data.players[2].rank_tier)  + '\nH:' + heroid(data.players[2].hero_id, herodataJSON) + '\nK:' + data.players[2].kills + '\nD:' + data.players[2].deaths + '\nA:' + data.players[2].assists + '\nLH/D:' + data.players[2].last_hits + '/' + data.players[2].denies + '\nTWR:' + data.players[2].tower_damage + '\n\n4:' + personnamevalid(3, data) + '\nRank: ' + rankcalc(data.players[3].rank_tier)  + '\nH:' + heroid(data.players[3].hero_id, herodataJSON) + '\nK:' + data.players[3].kills + '\nD:' + data.players[3].deaths + '\nA:' + data.players[3].assists + '\nLH/D:' + data.players[3].last_hits + '/' + data.players[3].denies + '\nTWR:' + data.players[3].tower_damage + '\n\n' + '5:' + personnamevalid(4, data) + '\nRank: ' + rankcalc(data.players[4].rank_tier)  + '\nH:' + heroid(data.players[4].hero_id, herodataJSON) + '\nK:' + data.players[4].kills + '\nD:' + data.players[4].deaths + '\nA:' + data.players[4].assists + '\nLH/D:' + data.players[4].last_hits + '/' + data.players[4].denies + '\nTWR:' + data.players[4].tower_damage + '\n\n' + '```');
                message.channel.send('``` DIRE\n1:' + personnamevalid(5, data) + '\nRank:' + rankcalc(data.players[5].rank_tier)  + '\nH:' + heroid(data.players[5].hero_id, herodataJSON) + '\nK:' + data.players[5].kills + '\nD:' + data.players[5].deaths + '\nA:' + data.players[5].assists + '\nLH/D:' + data.players[5].last_hits + '/' + data.players[5].denies + '\nTWR:' + data.players[5].tower_damage + '\n\n2:' + personnamevalid(6, data) + '\nRank: ' + rankcalc(data.players[6].rank_tier)  + '\nH:' + heroid(data.players[6].hero_id, herodataJSON) + '\nK:' + data.players[6].kills + '\nD:' + data.players[6].deaths + '\nA:' + data.players[6].assists + '\nLH/D:' + data.players[6].last_hits + '/' + data.players[6].denies + '\nTWR:' + data.players[6].tower_damage + '\n\n' + '3:' + personnamevalid(7, data) + '\nRank: ' + rankcalc(data.players[7].rank_tier)  + '\nH:' + heroid(data.players[7].hero_id, herodataJSON) + '\nK:' + data.players[7].kills + '\nD:' + data.players[7].deaths + '\nA:' + data.players[7].assists + '\nLH/D:' + data.players[7].last_hits + '/' + data.players[7].denies + '\nTWR:' + data.players[7].tower_damage + '\n\n4:' + personnamevalid(8, data) + '\nRank: ' + rankcalc(data.players[8].rank_tier)  + '\nH:' + heroid(data.players[8].hero_id, herodataJSON) + '\nK:' + data.players[8].kills + '\nD:' + data.players[8].deaths + '\nA:' + data.players[8].assists + '\nLH/D:' + data.players[8].last_hits + '/' + data.players[8].denies + '\nTWR:' + data.players[8].tower_damage + '\n\n' + '5:' + personnamevalid(9, data) + '\nRank: ' + rankcalc(data.players[9].rank_tier)  + '\nH:' + heroid(data.players[9].hero_id, herodataJSON) + '\nK:' + data.players[9].kills + '\nD:' + data.players[9].deaths + '\nA:' + data.players[9].assists + '\nLH/D:' + data.players[9].last_hits + '/' + data.players[9].denies + '\nTWR:' + data.players[9].tower_damage + '\n\n' + '```');
            }
        }); 
    }   
}

function heroid(id, herodataJSON) {
    for (i = 0; i < 112; ++i) {
        if (id == herodataJSON.heroes[i].id) {
            return herodataJSON.heroes[i].localized_name;
        }
    }    
}

function winner(result) {
    if (result == true) {
        return 'Radiant';
    } else {
        return 'Dire';
    }
}


function lookupid(id) {
    for (i = 0; i < database.length; ++i) {
        if (id == database[i][0]) {
            return database[i][1];
        }
    }
    return id;
}

function rankcalc(rank_tier) {
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

    for (i = 0; i < 5; ++i) {
        if (rank.charAt(1) == i) {
            result += ' ';
            result += i;
        }
    }

    return result;
}

function gamemode(game_mode) {
    if (game_mode == 4) {
        return 'Low-prio';
    } else if (game_mode == 23) {
        return 'Turbo'; 
    } else if (game_mode == 22) {
        return 'Normal';
    } else {
        return 'nobody cares';
    }
}

client.on('ready', () => {
    console.log('dotabot loaded');
    client.user.setActivity('DOTA 2');
  });
  
  client.on('message', message => {

    var input = message.content;

    infocommand(input, message);
    helpcommand(input, message);
    dotabuff(input, message);
    lastmatchcommand(input, message);
    databasecommand(input, message);
    matchescommand(input, message);
    matchcommand(input, message, herodataJSON);

  });


client.login(process.env.BOT_TOKEN);
