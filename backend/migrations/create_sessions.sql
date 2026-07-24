CREATE TABLE IF NOT EXISTS sessions (
    session_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS session_bookmarks (
    session_id INTEGER NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    bookmark_id INTEGER NOT NULL REFERENCES bookmarks(bookmark_id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (session_id, bookmark_id)
);

CREATE INDEX IF NOT EXISTS session_bookmarks_session_id_idx ON session_bookmarks(session_id);
