const fs = require('fs');
const path = require('path');
const db = require('../postgresConfig');

async function main() {
    const sqlPath = path.join(__dirname, '../migrations/create_sessions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await db.none(sql);
    console.log('Sessions tables are ready.');
}

main()
    .catch((error) => {
        console.error('Failed to migrate sessions.', error);
        process.exitCode = 1;
    })
    .finally(() => db.$pool.end());
