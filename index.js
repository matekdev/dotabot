require('dotenv').config();
const { Client } = require("discord.js");

const helperMethods = require('./common/helper.js');
const request = require('request');
const heroData = require('./data/heroes.json');
const client = new Client({disableEveryone: true});

function help(commandArgs, channel) {
    if (commandArgs[0] == '!help') {
        channel.send('```Welcome to the dotabot created by Matthew Zegar. This bot gathers API data from "https://docs.opendota.com".\n'+
         '\nCommands:'+
         '\n!help - shows all commands '+
         '\n!info <id> - displays info about the dota player '+
         '\n!database - shows which names are present within the database '+
         '\n!lastmatch <id> - displays info about the last match the user played '+
         '\n!matches <id> - displays info about all the matches the user has played'+
         '\n!match <matchid> - shows information about the match \n!dotabuff - links to dotabuff ```');
    }
}

function openDota(commandArgs, channel) {
    if (commandArgs[0] == '!opendota') {
        channel.send('https://www.opendota.com/');
    }     
}

function info(commandArgs, channel) {
    if (commandArgs[0] == '!info') {
        let id = helperMethods.playerLookup(commandArgs[1]);
		let requestUrl = "http://api.opendota.com/api/players/";
        let url = requestUrl.concat(id);
        
        request(url, function (error, response, body) {
            let data = JSON.parse(body);
            if (data.error == 'Internal Server Error' || typeof data.profile == 'undefined') {
                channel.send('Error, invalid ID');
            } else {
                channel.send('```Name: ' + data.profile.personaname + 
                                    '\nRank: ' + helperMethods.findRankTier(data.rank_tier)  + 
                                    '\nCompetitive rank: ' + data.competitive_rank + 
                                    '\nMMR estimate: ' + data.mmr_estimate.estimate + 
                                    '```', {files: [data.profile.avatarmedium]});
            }
        }); 
    }
}

function lastMatch(commandArgs, channel) {
    if (commandArgs[0] == '!lastmatch') {
        let id = helperMethods.playerLookup(commandArgs[1]);
		let requestUrl = "http://api.opendota.com/api/players/";
        let url = requestUrl.concat(id, '/recentMatches');   

        request(url, function (error, response, body) {
            let data = JSON.parse(body);
            if (typeof data[0] == 'undefined') {
                channel.send('Error, invalid ID');
            } else {
                var heroName = 'Unknown';
                for (var hero of heroData['heroes']) {
                    if (data[0].hero_id == hero.id) {
                        heroName = hero.localized_name;
                    }
                }
                channel.send('https://www.opendota.com/matches/' + data[0].match_id);
                channel.send('```\nGamemode: ' + helperMethods.findGameMode(data[0].game_mode) + 
                                        '\nResult: ' + helperMethods.resultOfLastMatch(data[0].radiant_win, data[0].player_slot) + 
                                        '\nHero: ' + heroName + '\nDuration: ' + Math.round(data[0].duration/60) + ' mins' + 
                                        '\nLast hits: ' + data[0].last_hits + 
                                        '\nKills: ' + data[0].kills + 
                                        '\nAssists: ' + data[0].assists  + 
                                        '\nDeaths: ' + data[0].deaths + 
                                        '\nGPM: ' + data[0].gold_per_min + 
                                        '\nXPM: ' + data[0].xp_per_min + 
                                        '\nTower damage: ' + data[0].tower_damage + '```');
            }
        }); 

    }
}

function matches(commandArgs, channel) {
    if (commandArgs[0] == '!matches') {
        let id = helperMethods.playerLookup(commandArgs[1]);
        let requestUrl = "https://api.opendota.com/api/players/";
        let url = requestUrl.concat(id, '/counts');   

        request(url, function (error, response, body) {
            let data = JSON.parse(body);
            if (typeof data.leaver_status[0] == 'undefined') {
                channel.send('Error, invalid ID');
            } else {
                channel.send('```Total matches completed: ' 
                                    + data.leaver_status[0].games + 
                                    '\nWins: ' + data.leaver_status[0].win + 
                                    '\nLosses: ' + (data.leaver_status[0].games - data.leaver_status[0].win) + 
                                    '\nWon %: ' + Math.round((data.leaver_status[0].win / data.leaver_status[0].games)*100) +'```');
            }
        }); 
    }
}

function prizePool(commandArgs, channel) {
    if (commandArgs[0] == '!prize') {
        let url = "http://dota2.prizetrac.kr/international10";

        request(url, function (error, response, body) {
            let data = body;
            if (typeof data != "html") {
		if (helperMethods.parsePrizePoolWebsite(data) == '$0') {
			channel.send("```Error fetching data...```");
		} else {
			channel.send("```The International 10 prize pool is at " + helperMethods.parsePrizePoolWebsite(data) + "```");
		}
            } else {   
                channel.send("```Error obtaining website data...```");
            }
        }); 
    }       
}

client.on("ready", () => {
    console.log("Launching dotabot");
});

client.on("message", async message => {
    const commandArgs = message.content.split(' ');
    const channel = message.channel;

    if (commandArgs.length > 0) {
        help(commandArgs, channel);
        openDota(commandArgs, channel);
        prizePool(commandArgs, channel);
    }

    if (commandArgs.length > 1) {
        info(commandArgs, channel);
        lastMatch(commandArgs, channel);
        matches(commandArgs, channel);
    }
});

// Heroku login
client.login(process.env.BOT_TOKEN);