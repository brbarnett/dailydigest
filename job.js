const _ = require('lodash');
const fs = require('fs');
const request = require('request');

const jobConfig = require('./job.config');

const sendgridConfig = require('./sendgrid.config');
const sendgrid = require('sendgrid')(sendgridConfig.apiKey);

const url = getFormattedUrl();
request.get({
    url: url,
    json: true
}, (error, response, body) => {
    if (!error && response.statusCode === 200) {
        const games = body.data.games.game;
        const gamesOfInterest = _.filter(games, (x) =>
            _.includes(jobConfig.teamsOfInterest, x.home_name_abbrev)
            || _.includes(jobConfig.teamsOfInterest, x.away_name_abbrev));

        if (gamesOfInterest.length <= 0) return; // don't send email if there are no games of interest today

        const formattedGames = getFormattedGames(gamesOfInterest);
        getFormattedEmail(formattedGames).then((body) => {
            sendEmail(body);
        });
    }
});

function sendEmail(body) {
    var email = new sendgrid.Email();

    _.forEach(jobConfig.recipients, (recipient) => {
       email.addTo(recipient); 
    });

    email.setFrom('no-reply@echosolutionsgroup.com');
    email.setFromName('Daily Digest Job');
    email.setSubject('Daily Digest Email');
    email.setHtml(body);

    sendgrid.send(email);
}

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
            if (err) reject(err);

            var html = data;
            var rows = '';

            fs.readFile('./gamerow.html', 'utf-8', (err, data) => {
                if (err) reject(err);

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