const db = require('../database/db');
const _ = require('lodash');

const c = require('./../constants');
const t = c.TABLES;
const axios = require('axios')

/**
 * Ranker
 * 
 * It is responsible for ranking
 * the companies according Free or Paid package.
 * Free package companies are ranked below
 * any paid package companies.
 */

const ranker = async () => {
    let connection;
    try {
        connection = await db.getConnectionAsync();

        //get companies
        const companies = await _getCompanies(connection);

        //shuffle the companies
        const shuffledCompanies = _.shuffle(companies);

        //generate new ranks
        let counter = 0;
        const newRanks = shuffledCompanies.map( company => {
            if (company.package_id === c.FREE_PACKAGE_ID)
                return { listing_id: company.listing_id, rank: c.FREE_COMPANY_BASE_RANK }
            else {
                counter++;
                return { listing_id: company.listing_id, rank: counter }
            }
        });

        //update companies rank
        await _updateRanks(connection, newRanks, companies);

            // Algolia Sync 
            await axios.get('https://www.pharmahopers.com/api/sync-algolia')
            .then(res => {
                console.log('Algolia sync Status Code:', res.status);
            })
            .catch(err => {
                console.log('Error: ', err.message);
            });

    } catch (e) {
        console.log(e.message);
    } finally {
        connection.release();
    }
}

const _getCompanies = async (connection) => {

    return await db.queryAsync(`SELECT listing_id, package_id
        FROM ${t.COMPANY_PACKAGE}`);
}

const _updateRanks = async (connection, newRanks, companies) => {
    const sql = _generateSql(newRanks, companies);
    await db.queryAsync(sql);
}

const _generateSql = (newRanks, companies) => {
    let cases = newRanks.map( rank => `WHEN id = ${rank.listing_id} THEN ${rank.rank}`);
    let ids = companies.map( company => company.listing_id );

    return `UPDATE ${t.COMPANY}
            SET \`rank\` = ( CASE ${cases.join(' ')} END )
            WHERE id in ( ${ids.toString()} );`;
}

module.exports = ranker;
