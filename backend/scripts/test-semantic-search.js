const db = require('../postgresConfig');
const { searchBookmarksSemantically } = require('../bookmarkEmbeddings');

async function main() {
    const userId = Number(process.argv[2] || 1);
    const query = process.argv[3] || 'soda';

    const results = await searchBookmarksSemantically(db, userId, query);
    console.log(JSON.stringify(results, null, 2));
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => db.$pool.end());
