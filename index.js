const ranker = require('./ranker');
const creditor = require('./creditor');
const hitRemover = require('./hit_remover');
const notifier = require("./notifier/index");
const operation = require("./operations");
const checkWebsiteStatus  = require('./website_reloader');
const cron = require('node-cron');

/*
    ┌────────────── second (optional)
    │ ┌──────────── minute
    │ │ ┌────────── hour
    │ │ │ ┌──────── day of month
    │ │ │ │ ┌────── month
    │ │ │ │ │ ┌──── day of week
    │ │ │ │ │ │
    │ │ │ │ │ │
    * * * * * *
*/


// run every 1 minutes
cron.schedule('*/1 * * * *', () => {
    ranker();
    console.log('Pharmahoper Companies ranking script completed at ', new Date().toLocaleString());
});

// run every 1 minutes
cron.schedule('*/1 * * * *', () => {
    checkWebsiteStatus();
});

// // run daily at 12:05 AM
cron.schedule('05 0 * * *', () => {
    creditor();
    console.log('Pharmahoper Companies creditor script completed at ', new Date().toLocaleString());
});

// // run daily at 1:01 AM
cron.schedule('1 1 * * *', () => {
    hitRemover();
    console.log('Pharmahoper hit table remover script completed at ', new Date().toLocaleString());
});

// // run daily at 8:30 AM
cron.schedule('30 8 * * *', () => {
    notifier();
    console.log('Pharmahoper notifier script completed at ', new Date().toLocaleString());
});

//operation.buyLeadMailer();
//operation.bulkMailCustomer();


console.log(`Pharmahoper Timed task running in ${process.env.NODE_ENV === 'production' ? 'Production' : "Development"} mode`);

