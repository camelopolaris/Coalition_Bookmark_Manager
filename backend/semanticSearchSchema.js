const PGVECTOR_HELP = `
pgvector is not installed on this PostgreSQL server.
Semantic search will use a real[] column instead of native vector indexes.

To enable pgvector later (recommended on Windows, run PowerShell as Administrator):
  powershell -ExecutionPolicy Bypass -File backend/scripts/install-pgvector-windows.ps1
  node backend/scripts/migrate-semantic-search.js
`;

async function getSearchEmbeddingColumn(db) {
    return db.oneOrNone(
        `SELECT udt_name
         FROM information_schema.columns
         WHERE table_schema = current_schema()
           AND table_name = 'bookmarks'
           AND column_name = 'search_embedding'`,
    );
}

async function isPgVectorAvailable(db) {
    const available = await db.oneOrNone(
        `SELECT 1 AS ok FROM pg_available_extensions WHERE name = 'vector'`,
    );

    if (!available) {
        return false;
    }

    try {
        await db.none('CREATE EXTENSION IF NOT EXISTS vector');
        return true;
    } catch {
        return false;
    }
}

async function ensureSemanticSearchSchema(db) {
    const existingColumn = await getSearchEmbeddingColumn(db);

    if (existingColumn?.udt_name === 'vector') {
        await db.none(`
            CREATE INDEX IF NOT EXISTS bookmarks_search_embedding_idx
            ON bookmarks
            USING hnsw (search_embedding vector_cosine_ops)
        `);
        return 'pgvector';
    }

    if (existingColumn?.udt_name === '_float4') {
        return 'real_array';
    }

    const pgVectorReady = await isPgVectorAvailable(db);

    if (pgVectorReady) {
        await db.none('ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS search_embedding vector(384)');
        await db.none(`
            CREATE INDEX IF NOT EXISTS bookmarks_search_embedding_idx
            ON bookmarks
            USING hnsw (search_embedding vector_cosine_ops)
        `);
        console.log('Semantic search schema ready (pgvector).');
        return 'pgvector';
    }

    console.warn(PGVECTOR_HELP.trim());
    await db.none('ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS search_embedding real[]');
    console.log('Semantic search schema ready (real[] fallback).');
    return 'real_array';
}

async function getSemanticSearchStorageMode(db) {
    const column = await getSearchEmbeddingColumn(db);

    if (!column) {
        return ensureSemanticSearchSchema(db);
    }

    return column.udt_name === 'vector' ? 'pgvector' : 'real_array';
}

module.exports = {
    PGVECTOR_HELP,
    ensureSemanticSearchSchema,
    getSemanticSearchStorageMode,
};
