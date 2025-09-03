const db = require('../database/db');
const t = require('./../constants').TABLES;

/**
 * 
 * Hit Remover
 * 
 * It is responsible for clearing 
 * the daily hits table
 */
const hitRemover = async () => {
    let connection;
    try {
        connection = await db.getConnectionAsync();
        db.queryAsync(`TRUNCATE TABLE ${t.DAILY_HITS};`);
    } catch (e) {
        console.log(e.message);
    } finally {
        connection.release();
    }
}

module.exports = hitRemover;