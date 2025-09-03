const c = require('./../constants');
const mailgun = require('mailgun-js')({ apiKey: c.MAILGUN_API_KEY, domain: c.MAILGUN_DOMAIN });


const from = 'PharmaHopers <info@pharmahopers.com>';

/**
 * ================================================
 * In development mode every e-mail will be sent to
 * test e-mails specified in dev_test_email array
 * ================================================
 */

const send = async (body, recipients) => {
    const subject = body.subject;
    const data = body.message;

    if (process.env.NODE_ENV !== 'production') {
        recipients = c.DEV_TEST_EMAIL;
    }

    try {
        await mailgun.messages().send({ from, to: recipients, subject, html: data });
    } catch (e) {
        console.log('error sending email: ' + e.message);
    }
}


module.exports = { send };
