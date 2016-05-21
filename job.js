const _ = require('lodash');
const fs = require('fs');
const request = require('request');
const sendgrid = require('sendgrid');

const config = require('./job.config');

const url = getFormattedUrl();
request.get({
    url: url,
    json: true
}, (error, response, body) => {
    if (!error && response.statusCode === 200) {
        const games = body.data.games.game;
        const gamesOfInterest = _.filter(games, (x) => _.includes(config.teamsOfInterest, x.home_name_abbrev));
        const formattedGames = getFormattedGames(gamesOfInterest);
        getFormattedEmail(formattedGames).then((body) => {
            console.log(body);
        })
    }
});

function getFormattedUrl() {
    const now = new Date();

    const date = {
        year: now.getFullYear(),
        month: _.padStart(now.getMonth() + 1, 2, '0'),
        day: _.padStart(now.getDate() + 1, 2, '0')
    };

    const url = `http://m.mlb.com/gdcross/components/game/mlb/year_${date.year}/month_${date.month}/day_${date.day}/master_scoreboard.json`;

    return url;
}

function getFormattedGames(games) {
    const formattedGames = _.map(games, (game) => {
        return {
            away: {
                name: game.away_team_name
            },
            home: {
                name: game.home_team_name
            },
            location: game.location,
            time: `${game.home_time} ${game.home_ampm} ${game.home_time_zone}`
        };
    });

    return formattedGames;
}

function getFormattedEmail(games) {
    const promise = new Promise((resolve, reject) => {
        fs.readFile('./email.html', 'utf-8', (err, data) => {
            if(err) reject(err);
            
            var html = data;
            var rows = '';

            fs.readFile('./gamerow.html', 'utf-8', (err, data) => {
                if(err) reject(err);
                
                const row = data;

                _.forEach(games, (game) => {
                    var gamerow = row;
                    gamerow = _.replace(gamerow, /{{away}}/, game.away.name);
                    gamerow = _.replace(gamerow, /{{home}}/, game.home.name);
                    gamerow = _.replace(gamerow, /{{location}}/, game.location);
                    gamerow = _.replace(gamerow, /{{time}}/, game.time);
                    rows += gamerow;
                });

                html = _.replace(html, /{{gamerows}}/, rows);

                resolve(html);
            });
        });
    });

    return promise;
}