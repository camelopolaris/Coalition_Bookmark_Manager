CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE bookmarks
ADD COLUMN IF NOT EXISTS search_embedding vector(384);

CREATE INDEX IF NOT EXISTS bookmarks_search_embedding_idx
ON bookmarks
USING hnsw (search_embedding vector_cosine_ops);
