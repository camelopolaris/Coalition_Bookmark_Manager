const { toSql: vectorToSql } = require('pgvector');
const { embedText } = require('./embeddings');
const { getSemanticSearchStorageMode } = require('./semanticSearchSchema');

const MIN_SEMANTIC_SIMILARITY = 0.2;
const DEFAULT_SEMANTIC_LIMIT = 50;

function buildBookmarkSearchText(name, url) {
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedUrl = typeof url === 'string' ? url.trim() : '';

    return [trimmedName, trimmedUrl].filter(Boolean).join('\n');
}

function cosineSimilarity(left, right) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length || left.length === 0) {
        return 0;
    }

    let dot = 0;
    let leftNorm = 0;
    let rightNorm = 0;

    for (let index = 0; index < left.length; index += 1) {
        const leftValue = Number(left[index]);
        const rightValue = Number(right[index]);
        dot += leftValue * rightValue;
        leftNorm += leftValue * leftValue;
        rightNorm += rightValue * rightValue;
    }

    if (leftNorm === 0 || rightNorm === 0) {
        return 0;
    }

    return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

async function generateBookmarkEmbedding(name, url) {
    const searchText = buildBookmarkSearchText(name, url);

    if (!searchText) {
        throw new Error('Bookmark name or URL is required to generate an embedding');
    }

    return embedText(searchText);
}

async function upsertBookmarkEmbedding(db, bookmarkId, userId, name, url) {
    const embedding = await generateBookmarkEmbedding(name, url);
    const storageMode = await getSemanticSearchStorageMode(db);

    if (storageMode === 'pgvector') {
        await db.none(
            `UPDATE bookmarks
             SET search_embedding = $1::vector
             WHERE bookmark_id = $2
               AND user_id = $3`,
            [vectorToSql(embedding), bookmarkId, userId],
        );
        return;
    }

    await db.none(
        `UPDATE bookmarks
         SET search_embedding = $1::real[]
         WHERE bookmark_id = $2
           AND user_id = $3`,
        [embedding, bookmarkId, userId],
    );
}

async function fetchTextMatches(db, userId, trimmedQuery, safeLimit) {
    return db.any(
        `SELECT bookmark_id,
                name,
                url,
                folder_id,
                user_id,
                1.0 AS similarity
         FROM bookmarks
         WHERE user_id = $1
           AND (
             LOWER(name) LIKE $2
             OR LOWER(url) LIKE $2
           )
         ORDER BY bookmark_id DESC
         LIMIT $3`,
        [userId, `%${trimmedQuery.toLowerCase()}%`, safeLimit],
    );
}

async function searchWithPgVector(db, userId, queryEmbedding, safeLimit) {
    return db.any(
        `SELECT bookmark_id,
                name,
                url,
                folder_id,
                user_id,
                1 - (search_embedding <=> $1::vector) AS similarity
         FROM bookmarks
         WHERE user_id = $2
           AND search_embedding IS NOT NULL
           AND 1 - (search_embedding <=> $1::vector) >= $3
         ORDER BY search_embedding <=> $1::vector
         LIMIT $4`,
        [vectorToSql(queryEmbedding), userId, MIN_SEMANTIC_SIMILARITY, safeLimit],
    );
}

async function searchWithRealArray(db, userId, queryEmbedding, safeLimit) {
    const bookmarks = await db.any(
        `SELECT bookmark_id,
                name,
                url,
                folder_id,
                user_id,
                search_embedding
         FROM bookmarks
         WHERE user_id = $1
           AND search_embedding IS NOT NULL`,
        [userId],
    );

    return bookmarks
        .map((bookmark) => ({
            bookmark_id: bookmark.bookmark_id,
            name: bookmark.name,
            url: bookmark.url,
            folder_id: bookmark.folder_id,
            user_id: bookmark.user_id,
            similarity: cosineSimilarity(queryEmbedding, bookmark.search_embedding),
        }))
        .filter((bookmark) => bookmark.similarity >= MIN_SEMANTIC_SIMILARITY)
        .sort((left, right) => right.similarity - left.similarity)
        .slice(0, safeLimit);
}

async function searchBookmarksSemantically(db, userId, query, { limit = DEFAULT_SEMANTIC_LIMIT } = {}) {
    const trimmedQuery = typeof query === 'string' ? query.trim() : '';

    if (!trimmedQuery) {
        return [];
    }

    const queryEmbedding = await embedText(trimmedQuery);
    const safeLimit = Math.min(Math.max(Number(limit) || DEFAULT_SEMANTIC_LIMIT, 1), 100);
    const storageMode = await getSemanticSearchStorageMode(db);

    const semanticMatches =
        storageMode === 'pgvector'
            ? await searchWithPgVector(db, userId, queryEmbedding, safeLimit)
            : await searchWithRealArray(db, userId, queryEmbedding, safeLimit);

    const textMatches = await fetchTextMatches(db, userId, trimmedQuery, safeLimit);
    const merged = new Map();

    for (const bookmark of semanticMatches) {
        merged.set(bookmark.bookmark_id, bookmark);
    }

    for (const bookmark of textMatches) {
        if (!merged.has(bookmark.bookmark_id)) {
            merged.set(bookmark.bookmark_id, bookmark);
        }
    }

    return [...merged.values()].sort((left, right) => right.similarity - left.similarity);
}

async function backfillBookmarkEmbeddings(db, userId = null) {
    const bookmarks = await db.any(
        `SELECT bookmark_id, name, url, user_id
         FROM bookmarks
         WHERE search_embedding IS NULL
           AND ($1::int IS NULL OR user_id = $1)`,
        [userId],
    );

    for (const bookmark of bookmarks) {
        await upsertBookmarkEmbedding(
            db,
            bookmark.bookmark_id,
            bookmark.user_id,
            bookmark.name,
            bookmark.url,
        );
    }

    return bookmarks.length;
}

module.exports = {
    MIN_SEMANTIC_SIMILARITY,
    DEFAULT_SEMANTIC_LIMIT,
    buildBookmarkSearchText,
    generateBookmarkEmbedding,
    upsertBookmarkEmbedding,
    searchBookmarksSemantically,
    backfillBookmarkEmbeddings,
};
