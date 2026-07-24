const db = require('../postgresConfig');
const { backfillBookmarkEmbeddings } = require('../bookmarkEmbeddings');
const { ensureSemanticSearchSchema } = require('../semanticSearchSchema');

async function main() {
    const storageMode = await ensureSemanticSearchSchema(db);
    console.log(`Semantic search schema is ready (${storageMode}).`);

    const backfilledCount = await backfillBookmarkEmbeddings(db);
    console.log(`Backfilled embeddings for ${backfilledCount} bookmark(s).`);
}

main()
    .catch((error) => {
        console.error('Failed to migrate semantic search.', error.message || error);
        process.exitCode = 1;
    })
    .finally(() => db.$pool.end());
