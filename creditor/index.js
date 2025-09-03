const moment = require('moment');

const db = require('../database/db');
const c = require('./../constants');
const t = c.TABLES;
const mailgun = require('mailgun-js')({ apiKey: c.MAILGUN_API_KEY, domain: c.MAILGUN_DOMAIN });

/**
 * 
 * Creditor
 * 
 * It is responsible for managing credits of
 * the company based on expiration date.
 * Removes credits and cycle credits if package 
 * has been expired.
 * Removes addon credits if addon end date has passed.
 * Adds credits after each cycle
 */

const creditor = async () => {
    let connection;
    try {
        connection = await db.getConnectionAsync();

        //move expiry companies to FREE package
        await _moveExpiryToFreePackage(connection);

        //remove addon credits
        await _removeAddonCredits(connection);

        //remove old lead addon credits
        await _removeOldLeadAddonCredits(connection);

        //initailize new cycle
        await _initCycle(connection);
        
    } catch (e) {
        console.log(e.message);
    } finally {
        connection.release();
    }
}


const _moveExpiryToFreePackage = async (connection) => {
    const currentDate = _getDate();
    let freePackage = await db.queryAsync(`SELECT credit, duration, cycle_credit, cycle_duration
        FROM ${t.PACKAGE}
        WHERE id = ${c.FREE_PACKAGE_ID};`);
    freePackage = freePackage[0];

    await db.queryAsync(`UPDATE ${t.COMPANY_PACKAGE}
        SET
            package_id = ${c.FREE_PACKAGE_ID},
            credits = ${freePackage.credit},
            subscribed_on = '${currentDate}',
            ending_on = '${_getFutureDate(freePackage.duration)}',
            cycle_credits = ${freePackage.cycle_credit},
            cycle_start = '${currentDate}',
            cycle_end = '${currentDate}'
        WHERE package_id != ${c.FREE_PACKAGE_ID} AND ending_on < '${currentDate}';`);
}


const _removeAddonCredits = async (connection) => {
    const currentDate = _getDate();
    await db.queryAsync(`UPDATE ${t.COMPANY_PACKAGE}
        SET
            addon_credits = 0
        WHERE addon_end < '${currentDate}';`);
}

const _removeOldLeadAddonCredits = async (connection) => {
    const currentDate = _getDate();
    await db.queryAsync(`UPDATE ${t.COMPANY_PACKAGE}
        SET
            old_lead_addon_credits = 0
        WHERE old_lead_addon_credits_end < '${currentDate}';`);
}


const _initCycle = async (connection) => {
    const packages = await _getPackages(connection);
    const currentDate = _getDate();

    const creditCase = packages.map( _package => `WHEN package_id = ${_package.id} THEN (credits - ${_package.cycle_credit})`);
    const cycleCreditCase = packages.map( _package => `WHEN package_id = ${_package.id} THEN ${_package.cycle_credit}`);
    const cycleEndCase = packages.map( _package => `WHEN package_id = ${_package.id} THEN '${_getFutureDate(_package.cycle_duration)}'`);


    const frm = 'PharmaHopers <info@pharmahopers.com>';
    const bcc = 'pharmahopers@gmail.com';
    
    //get companies
    //const companies = await _getCompanies(connection,currentDate);
    const companies = await _getCompaniesCycle(connection,currentDate);
    
    //console.log(companies);

    let html = JSON.stringify(companies,undefined, 3);
    try {
        companies.forEach( company => {
            db.queryAsync(`INSERT INTO ${t.COMPANY_PACKAGE_HISTORY} 
            (listing_id, package_id, credits, subscribed_on, ending_on, cycle_credits, cycle_start, cycle_end, addon_credits, addon_start, addon_end, old_lead_addon_credits, old_lead_addon_credits_start, old_lead_addon_credits_end) 
            VALUES ('${company.listing_id}', '${company.package_id}', '${company.credits}', '${_getFormatedDate(company.subscribed_on)}', '${_getFormatedDate(company.ending_on)}', '${company.cycle_credits}', '${_getFormatedDate(company.cycle_start)}', '${_getFormatedDate(company.cycle_end)}', '${company.addon_credits}', '${_getFormatedDate(company.addon_start)}', '${_getFormatedDate(company.addon_end)}', '${company.old_lead_addon_credits}', '${_getFormatedDate(company.old_lead_addon_credits_start)}', '${_getFormatedDate(company.old_lead_addon_credits_end)}');`)
            
        });
        
        await mailgun.messages().send({ from: frm, to: "sunil@webhopers.com", bcc, subject: `Cycle History ${currentDate}`, html });
    
    } catch (e) {
        console.log('error sending email: ' + e.message);
    }


    await db.queryAsync(`UPDATE ${t.COMPANY_PACKAGE}
        SET
            credits = ( CASE ${creditCase.join(' ')} END ),
            cycle_credits = ( CASE ${cycleCreditCase.join(' ')} END ),
            cycle_start = '${currentDate}',
            cycle_end = ( CASE ${cycleEndCase.join(' ')} END )
        WHERE package_id != ${c.FREE_PACKAGE_ID} AND ending_on > '${currentDate}' AND cycle_end <= DATE('${currentDate}') AND credits > 0;`)
    
    // Auto disable listing banners if the listing becomes free
    await db.queryAsync(`UPDATE ${t.COMPANY} L 
        JOIN ${t.COMPANY_PACKAGE} LP
        ON LP.listing_id = L.id AND LP.package_id = ${c.FREE_PACKAGE_ID}
        JOIN ${t.BANNERS} B
        ON B.url LIKE concat('%' , L.slug) AND B.active = 1
        SET B.active=0;`)

}


const _getPackages = async (connection) => {
    return await db.queryAsync(`SELECT id, cycle_credit, cycle_duration
        FROM ${t.PACKAGE};`);
}

// const _getCompanies = async (connection,currentDate) => {
//     return await db.queryAsync(`SELECT * FROM ${t.COMPANY_PACKAGE}
//     WHERE package_id != ${c.FREE_PACKAGE_ID} AND ending_on > '${currentDate}' AND cycle_end <= DATE('${currentDate}') AND credits > 0;`)
// }

const _getCompaniesCycle = async (connection,currentDate) => {
    return await db.queryAsync(`SELECT * FROM ${t.COMPANY_PACKAGE}
    WHERE package_id != ${c.FREE_PACKAGE_ID} AND cycle_end <= DATE('${currentDate}') AND credits > 0;`)
}

const _getDate = () => moment().format('YYYY-MM-DD') + ' 00:00:00';

const _getFutureDate = (days) => moment().add(days, 'days').format('YYYY-MM-DD') + ' 00:00:00';

const _getFormatedDate = (dateParam) => { if(moment(dateParam).isValid()) { return moment(dateParam).format('YYYY-MM-DD') + ' 00:00:00'}  else return '2010-01-01 00:00:00'; };

module.exports = creditor;
