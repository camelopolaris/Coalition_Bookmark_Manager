const initOptions = {
    query(e){
        console.log("Coalition QUERY: ", e.query);
    }
};
const pgp = require ('pg-promise')(initOptions);
const pgpConnectionCredentials = {
    host : 'localhost',
    port: 5432,
    database: 'coalition',
    user: 'postgres',
    password: 'postgres',
    max: 10,
};
const db = pgp(pgpConnectionCredentials);

module.exports = db;