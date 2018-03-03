const Discord = require('discord.js');
const client = new Discord.Client();
var request = require('request');

var info = ['NjYxOTQxNDc2NzcwNDg4MzI.DUg2sA.szQQxYoIeViB7xzBga-ZASGYEU', 'matt']
var channel = client.channels.get('348698341242306560');

var http = require('http');
var fs = require('fs');

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
        message.channel.send('```Welcome to the dotabot created by Matthew Zegar. This bot gathers API data from "https://docs.opendota.com".\n \nCommands:\n!help - shows all commands \n!info <id> - displays info about the dota player \n!database - shows which names are present within the database \n!lastmatch <id> - displays info about the last match the user played \n!matches <id> - displays info about all the matches the user has played ```');
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
                message.channel.send('```Total matches completed: ' + data.leaver_status[0].games + '\nWins: ' + data.leaver_status[0].win + '\nLosses: ' + (data.leaver_status[0].games - data.leaver_status[0].win) + '\nWon %: ' + Math.round((data.leaver_status[0].win / data.leaver_status[0].games)*100) + '\nTotal abandons: ' + data.leaver_status[3].games + '```');
            }
        }); 
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
  });
  
  client.on('message', message => {

    var input = message.content;

    infocommand(input, message);
    helpcommand(input, message);
    dotabuff(input, message);
    lastmatchcommand(input, message);
    databasecommand(input, message);
    matchescommand(input, message);

  });

client.login(process.env.BOT_TOKEN);
