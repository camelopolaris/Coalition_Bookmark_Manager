const db = require('../postgresConfig');

async function main() {
    const version = await db.one('SELECT version() AS version');
    console.log('PostgreSQL:', version.version);

    const columns = await db.any(
        `SELECT column_name, data_type, udt_name
         FROM information_schema.columns
         WHERE table_name = 'bookmarks'
         ORDER BY ordinal_position`,
    );
    console.log('bookmarks columns:', columns);

    try {
        const extensions = await db.any(
            `SELECT extname FROM pg_extension WHERE extname = 'vector'`,
        );
        console.log('vector extension:', extensions);
    } catch (error) {
        console.log('vector extension check failed:', error.message);
    }
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => db.$pool.end());
