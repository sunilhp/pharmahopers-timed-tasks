let mysql = require("mysql2");
const util = require("util");
const pool = mysql.createPool(require('./../config').DB);


const getConnectionAsync = util.promisify(pool.getConnection).bind(pool);
const queryAsync = util.promisify(pool.query).bind(pool);

module.exports = { getConnectionAsync, queryAsync };