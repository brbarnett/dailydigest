const _ = require('lodash');
const sendgridConfig = require('./sendgrid.config');
const sendgrid = require('sendgrid')(sendgridConfig.apiKey);

module.exports = {
    send: send
};

function send(body, recipients) {
    var email = new sendgrid.Email();

    _.forEach(recipients, (recipient) => {
        email.addTo(recipient);
    });

    email.setFrom('no-reply@echosolutionsgroup.com');
    email.setFromName('Daily Digest Job');
    email.setSubject('Daily Digest Email');
    email.setHtml(body);

    sendgrid.send(email);
}

