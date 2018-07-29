// Include .JS files, setup discord.js settings
const Discord = require('discord.js');
const client = new Discord.Client();
var request = require('request');
// All channels within the discord
// var channel = client.channels.get('348698341242306560');

// Load in DOTA 2 hero champion data
var herodataJSON;
request('https://raw.githubusercontent.com/mzegar/dota2-api/e04b622288427ae6b41f63a0b2d4061eaf1784a1/data/heroes.json', function (error, response, body) {
    herodataJSON = JSON.parse(body);   
});

// Local database due to Discord not supporting API to see who has connected steam accounts.
// This allows it so commands can be used like... !lastmatch fogell
// Instead of using their DOTA ID any custom string will work
var database = [
    ['matt', '49604109'],
    ['fogell', '78019306'],
    ['aggressive', '384363192'],
    ['lip', '185712789'],
    ['helper', '457659216'],
    ['psychiatric', '134235356'],
    ['russian', '446630043'],
    ['ben', '80162306'],
    ['josh', '80688700'],
    ['juicyj', '301932227'],
    ['chup', '71220683'],
    ['jonko', '89100568'],
    ['ryan', '569142'],
    ['ricky', '413932517'],
    ['troy', '381804788'],
    ['gar', '94210317'],
    ['jimson', '34483138']
];


function appendURL(url1, id, url2) {
    return url1.concat(id, url2);
}

// Help command
function helpcommand(input, message) {
    if (message.content.startsWith('!help')) {
        message.channel.send('```Welcome to the dotabot created by Matthew Zegar. This bot gathers API data from "https://docs.opendota.com".\n \nCommands:\n!help - shows all commands \n!info <id> - displays info about the dota player \n!database - shows which names are present within the database \n!lastmatch <id> - displays info about the last match the user played \n!matches <id> - displays info about all the matches the user has played\n!match <matchid> - shows information about the match \n!dotabuff - links to dotabuff ```');
    }
}

// Lists all of the users within the database
function databasecommand(input, message) {
    if (message.content.startsWith('!database')) {
        for (i = 0; i < database.length; i++) {
            message.channel.send(database[i][0]);
        }
    }  
}

// Links dotabuff
function dotabuff(input, message) {
    if (message.content.startsWith('!dotabuff')) {
        message.channel.send('https://www.dotabuff.com/');
    }     
}

// Not all users in the API have a name, anonymous will be returned with the DOTA API cannot find a name
function personnamevalid(num, data) {
        if (typeof data.players[num].personaname == 'undefined') {
            return 'Anonymous';
        } else {
            return data.players[num].personaname;
        } 
}

// !info command
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

// !lastmatch command
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
                    message.channel.send('```\nGamemode: ' + gamemode(data[0].game_mode) + '\nResult: ' + winnerlastmatch(data[0].radiant_win, data[0].player_slot) + '\nHero: ' + hero + '\nDuration: ' + Math.round(data[0].duration/60) + ' mins' + '\nLast hits: ' + data[0].last_hits + '\nKills: ' + data[0].kills + '\nAssists: ' + data[0].assists  + '\nDeaths: ' + data[0].deaths + '\nGPM: ' + data[0].gold_per_min + '\nXPM: ' + data[0].xp_per_min + '\nTower damage: ' + data[0].tower_damage + '```');
                }); 
            }
        }); 

    }
}

// !matches command
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

// !match command
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

// !delete command, removes messages from server
function deletecommand(input, message) {
    if (message.content.startsWith('!delete')) {
        message.channel.fetchMessages({limit: 15}).then(messages => {
            const botMessages = messages.filter(msg => msg.author.bot);
            message.channel.bulkDelete(botMessages);
            messagesDeleted = botMessages.array().length;
            message.delete();
        });
    }
}

// !prize command, shows prize pool for TI8
function prizecommand(input, message) {
    if (message.content.startsWith('!prize')) {
        let id = lookupid(input.substring(7, (input.length)));
        let url = "http://dota2.prizetrac.kr/international2018";

        request(url, function (error, response, body) {
            let data = body;
            if (typeof data != "html") {
		if (prizeparse(data) == '$0') {
			message.channel.send("```Error fetching data...```");
		} else {
			message.channel.send("```The International 2018 prize pool is at " + prizeparse(data) + "```");
		}
            } else {   
                console.log(data);
                message.channel.send("```Error obtaining website data...```");
            }
        }); 
    }       
}

function spamcommand(input, message) {
    if (message.content.startsWith('!fogell')) {
	    for (i = 0; i < 20000000000000000000000000000000000000000000; ++i) {
		message.channel.send("@fogell");    
	    }
    }
}

// Finds the proper hero_id
function heroid(id, herodataJSON) {
    for (i = 0; i < herodataJSON.heroes.length; ++i) {
        if (id == herodataJSON.heroes[i].id) {
            return herodataJSON.heroes[i].localized_name;
        }
    }    
}

// Outputs the result of the match in a better format
function winner(result) {
    if (result == true) {
        return 'Radiant';
    } else {
        return 'Dire';
    }
}

function winnerlastmatch(result, playerslot) {
    if (((playerslot >> 7) & 1) === 0) {
        // Raidant 
        if (winner(result) == 'Radiant') {
            return 'Won';
        } else {
            return 'Lost';
        }
    } else {
        // Dire
        if (winner(result) == 'Dire') {
            return 'Won';
        } else {
            return 'Lost';
        }
    }
}

// Looks through the database for any matching names
function lookupid(id) {
    for (i = 0; i < database.length; ++i) {
        if (id == database[i][0]) {
            return database[i][1];
        }
    }
    return id;
}


// Calculates the ranks
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

    for (i = 0; i < 6; ++i) {
        if (rank.charAt(1) == i) {
            result += ' ';
            result += i;
        }
    }

    return result;
}




// Finds which gamemode
function gamemode(game_mode) {
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
    } else {
	return 'Unkown';    
    }
}

function prizeparse(data) {
    let index = data.indexOf('green header') + 14;
    let index2 = -1;
    let string = data.substring(index, index+40);
    
    for (let i = 0; i < 40; ++i) {
        if (string[i] == '<') {
            index2 = i;
            break;
        }
    }
    
    return string.substring(0, index2);
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
    deletecommand(input, message);
    prizecommand(input, message);
    spamcommand(input, message);

  });


// Heroku login
client.login(process.env.BOT_TOKEN);
