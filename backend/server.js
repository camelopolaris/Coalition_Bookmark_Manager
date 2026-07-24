const express = require('express');
require('dotenv').config();

const jwt = require('jsonwebtoken');

//FIXME: EXAMPLE JWT
//console.log(jwt.sign({data: 'test'}, process.env.JWT_SECRET))
//Initialize app
const app = express();

//CORS
const cors = require('cors');

//Initialize express-validator
const { query } = require('express-validator');

app.use(express.json());
app.use(cors({origin: "http://localhost:5173"}));

const port = 3000;
//db contains initialized database with config information
const db = require('./postgresConfig');
const {
    BOOKMARK_SELECT_COLUMNS,
    BOOKMARK_WRITABLE_FIELDS,
    parseBookmarkBody,
    parseBookmarkFolderId,
} = require('./bookmarkFields');
const {
    FOLDER_SELECT_COLUMNS,
    parseFolderBody,
    parseFolderName,
    parseParentId,
} = require('./folderFields');
const {
    TIMESTAMP_SELECT_COLUMNS,
    PAGE_NUMBER_SELECT_COLUMNS,
    parseTimestampValue,
    parseNoteContent,
    parsePageNumber,
    mapTimestampRow,
    mapPageNumberRow,
} = require('./bookmarkAnnotationFields');

const { USER_SELECT_COLUMNS, parseAccountUpdateBody } = require('./userFields');
const {
    SESSION_SELECT_COLUMNS,
    parseSessionName,
    parseSessionBody,
    parseBookmarkId: parseSessionBookmarkId,
    mapSessionRow,
} = require('./sessionFields');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

async function getUserFolder(userId, folderId) {
    if (folderId === null || folderId === undefined) {
        return null;
    }

    return db.oneOrNone(
        `SELECT folder_id
         FROM folders
         WHERE folder_id = $1
           AND user_id = $2`,
        [folderId, userId],
    );
}

async function getUserBookmark(userId, bookmarkId) {
    return db.oneOrNone(
        `SELECT bookmark_id
         FROM bookmarks
         WHERE bookmark_id = $1
           AND user_id = $2`,
        [bookmarkId, userId],
    );
}

function parseBookmarkIdParam(value) {
    const bookmarkId = Number(value);

    if (!Number.isInteger(bookmarkId)) {
        return { error: 'Invalid bookmark id' };
    }

    return { value: bookmarkId };
}

function parseSessionIdParam(value) {
    const sessionId = Number(value);

    if (!Number.isInteger(sessionId)) {
        return { error: 'Invalid session id' };
    }

    return { value: sessionId };
}

async function getUserSession(userId, sessionId) {
    return db.oneOrNone(
        `SELECT session_id
         FROM sessions
         WHERE session_id = $1
           AND user_id = $2`,
        [sessionId, userId],
    );
}

async function loadUserSessions(userId) {
    const rows = await db.any(
        `SELECT s.session_id,
                s.name,
                s.user_id,
                COALESCE(
                    array_agg(sb.bookmark_id ORDER BY sb.position, sb.bookmark_id)
                    FILTER (WHERE sb.bookmark_id IS NOT NULL),
                    '{}'
                ) AS bookmark_ids
         FROM sessions s
         LEFT JOIN session_bookmarks sb ON sb.session_id = s.session_id
         WHERE s.user_id = $1
         GROUP BY s.session_id, s.name, s.user_id
         ORDER BY s.name ASC`,
        [userId],
    );

    return rows.map(mapSessionRow);
}

function collectDescendantFolderIds(folders, rootFolderId) {
    const ids = new Set([rootFolderId]);
    let changed = true;

    while (changed) {
        changed = false;

        for (const folder of folders) {
            if (folder.parent_id !== null && ids.has(folder.parent_id) && !ids.has(folder.folder_id)) {
                ids.add(folder.folder_id);
                changed = true;
            }
        }
    }

    return [...ids];
}

async function validateFolderParentMove(userId, folderId, newParentId) {
    if (newParentId === folderId) {
        return 'A folder cannot be its own parent';
    }

    if (newParentId !== null) {
        const parentFolder = await getUserFolder(userId, newParentId);

        if (!parentFolder) {
            return 'Parent folder not found';
        }
    }

    const folders = await db.any(
        `SELECT folder_id, parent_id
         FROM folders
         WHERE user_id = $1`,
        [userId],
    );

    const descendantIds = collectDescendantFolderIds(folders, folderId);

    if (newParentId !== null && descendantIds.includes(newParentId)) {
        return 'A folder cannot be moved into its own subfolder';
    }

    return null;
}

function getLeafFolderIds(folders, folderIds) {
    const idSet = new Set(folderIds);

    return folderIds.filter((folderId) =>
        !folders.some(
            (folder) => folder.parent_id === folderId && idSet.has(folder.folder_id),
        ),
    );
}

app.get('/', (req, res) => {

    res.json("Coalition backend API running!");
});
//MARK: Auth
app.post('/login', async (req, res) => {
    const { username, password } = req.body || {}

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' })
    }

    try {
        const user = await db.oneOrNone(
            `SELECT user_id, username
             FROM users
             WHERE username = $1
               AND password = crypt($2, password)`,
            [username, password],
        )

        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' })
        }

        const token = jwt.sign({ userId: user.user_id, username: user.username }, JWT_SECRET, {
            expiresIn: '1h',
        })

        return res.json({ success: true, token, user: { user_id: user.user_id, username: user.username } })
    } catch (error) {
        console.error('Login error:', error)
        return res.status(500).json({ message: 'Unable to log in' })
    }
})

app.post('/signup', async (req, res) => {
    const { username, password } = req.body || {}

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' })
    }

    try {
        const existingUser = await db.oneOrNone(
            'SELECT user_id FROM users WHERE username = $1',
            [username],
        )

        if (existingUser) {
            return res.status(409).json({ message: 'Username already exists' })
        }

        const createdUser = await db.one(
            `INSERT INTO users (username, password)
             VALUES ($1, crypt($2, gen_salt('sha512crypt')))
             RETURNING user_id, username`,
            [username, password],
        )

        const token = jwt.sign({ userId: createdUser.user_id, username: createdUser.username }, JWT_SECRET, {
            expiresIn: '1h',
        })

        return res.status(201).json({ success: true, token, user: { user_id: createdUser.user_id, username: createdUser.username } })
    } catch (error) {
        console.error('Signup error:', error)
        return res.status(500).json({ message: 'Unable to create account' })
    }
})

app.get('/users/me', authenticateToken, async (req, res) => {
    try {
        const user = await db.oneOrNone(
            `SELECT ${USER_SELECT_COLUMNS}
             FROM users
             WHERE user_id = $1`,
            [req.user.userId],
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json(user);
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({ message: 'Unable to fetch account' });
    }
});

app.patch('/users/me', authenticateToken, async (req, res) => {
    const { parsed, errors } = parseAccountUpdateBody(req.body);

    if (errors.length > 0) {
        return res.status(400).json({ message: errors[0] });
    }

    const updateFields = Object.keys(parsed).filter((field) => field !== 'current_password');

    if (updateFields.length === 0) {
        return res.status(400).json({ message: 'At least one field must be provided' });
    }

    try {
        const currentUser = await db.oneOrNone(
            `SELECT user_id, username, password
             FROM users
             WHERE user_id = $1`,
            [req.user.userId],
        );

        if (!currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (parsed.password !== undefined) {
            const verifiedUser = await db.oneOrNone(
                `SELECT user_id
                 FROM users
                 WHERE user_id = $1
                   AND password = crypt($2, password)`,
                [req.user.userId, parsed.current_password],
            );

            if (!verifiedUser) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }
        }

        if (parsed.username !== undefined && parsed.username !== currentUser.username) {
            const existingUser = await db.oneOrNone(
                'SELECT user_id FROM users WHERE username = $1 AND user_id <> $2',
                [parsed.username, req.user.userId],
            );

            if (existingUser) {
                return res.status(409).json({ message: 'Username already exists' });
            }
        }

        const setParts = [];
        const values = [];

        if (parsed.username !== undefined && parsed.username !== currentUser.username) {
            setParts.push(`username = $${setParts.length + 1}`);
            values.push(parsed.username);
        }

        if (parsed.password !== undefined) {
            setParts.push(`password = crypt($${setParts.length + 1}, gen_salt('sha512crypt'))`);
            values.push(parsed.password);
        }

        if (setParts.length === 0) {
            return res.json({
                success: true,
                token: jwt.sign(
                    { userId: currentUser.user_id, username: currentUser.username },
                    JWT_SECRET,
                    { expiresIn: '1h' },
                ),
                user: {
                    user_id: currentUser.user_id,
                    username: currentUser.username,
                },
            });
        }

        const userIdParam = values.length + 1;

        const updatedUser = await db.one(
            `UPDATE users
             SET ${setParts.join(', ')}
             WHERE user_id = $${userIdParam}
             RETURNING ${USER_SELECT_COLUMNS}`,
            [...values, req.user.userId],
        );

        const token = jwt.sign(
            { userId: updatedUser.user_id, username: updatedUser.username },
            JWT_SECRET,
            { expiresIn: '1h' },
        );

        return res.json({
            success: true,
            token,
            user: updatedUser,
        });
    } catch (error) {
        console.error('Update account error:', error);
        return res.status(500).json({ message: 'Unable to update account' });
    }
});

//MARK: Folder CRUD

app.get('/folders', authenticateToken, async (req, res) => {
    try {
        const folders = await db.any(
            `SELECT ${FOLDER_SELECT_COLUMNS}
             FROM folders
             WHERE user_id = $1
             ORDER BY name ASC`,
            [req.user.userId],
        );

        return res.json(folders);
    } catch (error) {
        console.error('Get folders error:', error);
        return res.status(500).json({ message: 'Unable to fetch folders' });
    }
});

app.post('/folders', authenticateToken, async (req, res) => {
    const nameResult = parseFolderName(req.body?.name);
    const parentResult = parseParentId(req.body?.parent_id);

    if (nameResult.error) {
        return res.status(400).json({ message: nameResult.error });
    }

    if (parentResult.error) {
        return res.status(400).json({ message: parentResult.error });
    }

    try {
        if (parentResult.value !== null) {
            const parentFolder = await getUserFolder(req.user.userId, parentResult.value);

            if (!parentFolder) {
                return res.status(404).json({ message: 'Parent folder not found' });
            }
        }

        const folder = await db.one(
            `INSERT INTO folders (name, parent_id, user_id)
             VALUES ($1, $2, $3)
             RETURNING ${FOLDER_SELECT_COLUMNS}`,
            [nameResult.value, parentResult.value, req.user.userId],
        );

        return res.status(201).json(folder);
    } catch (error) {
        console.error('Create folder error:', error);
        return res.status(500).json({ message: 'Unable to create folder' });
    }
});

app.patch('/folders/:id', authenticateToken, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
        return res.status(400).json({ message: 'Invalid folder id' });
    }

    const { parsed, errors } = parseFolderBody(req.body, { allowPartial: true });

    if (errors.length > 0) {
        return res.status(400).json({ message: errors[0] });
    }

    const updateFields = Object.keys(parsed);

    if (updateFields.length === 0) {
        return res.status(400).json({ message: 'At least one field must be provided' });
    }

    if (parsed.parent_id !== undefined) {
        const moveError = await validateFolderParentMove(req.user.userId, id, parsed.parent_id);

        if (moveError) {
            return res.status(400).json({ message: moveError });
        }
    }

    const values = updateFields.map((field) => parsed[field]);
    const setClause = updateFields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const folderIdParam = updateFields.length + 1;
    const userIdParam = updateFields.length + 2;

    try {
        const folder = await db.oneOrNone(
            `UPDATE folders
             SET ${setClause}
             WHERE folder_id = $${folderIdParam}
               AND user_id = $${userIdParam}
             RETURNING ${FOLDER_SELECT_COLUMNS}`,
            [...values, id, req.user.userId],
        );

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        return res.json(folder);
    } catch (error) {
        console.error('Update folder error:', error);
        return res.status(500).json({ message: 'Unable to update folder' });
    }
});

app.delete('/folders/:id', authenticateToken, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
        return res.status(400).json({ message: 'Invalid folder id' });
    }

    try {
        const deletedFolderIds = await db.tx(async (transaction) => {
            const rootFolder = await transaction.oneOrNone(
                `SELECT folder_id
                 FROM folders
                 WHERE folder_id = $1
                   AND user_id = $2`,
                [id, req.user.userId],
            );

            if (!rootFolder) {
                return null;
            }

            const folders = await transaction.any(
                `SELECT folder_id, parent_id
                 FROM folders
                 WHERE user_id = $1`,
                [req.user.userId],
            );

            const folderIdsToDelete = collectDescendantFolderIds(folders, id);

            await transaction.none(
                `UPDATE bookmarks
                 SET folder_id = NULL
                 WHERE user_id = $1
                   AND folder_id = ANY($2::int[])`,
                [req.user.userId, folderIdsToDelete],
            );

            const remainingIds = new Set(folderIdsToDelete);

            while (remainingIds.size > 0) {
                const leafIds = getLeafFolderIds(folders, [...remainingIds]);

                if (leafIds.length === 0) {
                    throw new Error('Unable to resolve folder deletion order');
                }

                await transaction.none(
                    `DELETE FROM folders
                     WHERE user_id = $1
                       AND folder_id = ANY($2::int[])`,
                    [req.user.userId, leafIds],
                );

                for (const leafId of leafIds) {
                    remainingIds.delete(leafId);
                }
            }

            return folderIdsToDelete;
        });

        if (!deletedFolderIds) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        return res.json({ success: true, deletedFolderIds });
    } catch (error) {
        console.error('Delete folder error:', error);
        return res.status(500).json({ message: 'Unable to delete folder' });
    }
});

//MARK: Session CRUD

app.get('/sessions', authenticateToken, async (req, res) => {
    try {
        const sessions = await loadUserSessions(req.user.userId);
        return res.json(sessions);
    } catch (error) {
        console.error('Get sessions error:', error);
        return res.status(500).json({ message: 'Unable to fetch sessions' });
    }
});

app.post('/sessions', authenticateToken, async (req, res) => {
    const nameResult = parseSessionName(req.body?.name);

    if (nameResult.error) {
        return res.status(400).json({ message: nameResult.error });
    }

    try {
        const session = await db.one(
            `INSERT INTO sessions (name, user_id)
             VALUES ($1, $2)
             RETURNING ${SESSION_SELECT_COLUMNS}`,
            [nameResult.value, req.user.userId],
        );

        return res.status(201).json(mapSessionRow({ ...session, bookmark_ids: [] }));
    } catch (error) {
        console.error('Create session error:', error);
        return res.status(500).json({ message: 'Unable to create session' });
    }
});

app.patch('/sessions/:id', authenticateToken, async (req, res) => {
    const sessionResult = parseSessionIdParam(req.params.id);

    if (sessionResult.error) {
        return res.status(400).json({ message: sessionResult.error });
    }

    const { parsed, errors } = parseSessionBody(req.body, { allowPartial: true });

    if (errors.length > 0) {
        return res.status(400).json({ message: errors[0] });
    }

    const updateFields = Object.keys(parsed);

    if (updateFields.length === 0) {
        return res.status(400).json({ message: 'At least one field must be provided' });
    }

    const values = updateFields.map((field) => parsed[field]);
    const setClause = updateFields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const sessionIdParam = updateFields.length + 1;
    const userIdParam = updateFields.length + 2;

    try {
        const updatedSession = await db.oneOrNone(
            `UPDATE sessions
             SET ${setClause}
             WHERE session_id = $${sessionIdParam}
               AND user_id = $${userIdParam}
             RETURNING ${SESSION_SELECT_COLUMNS}`,
            [...values, sessionResult.value, req.user.userId],
        );

        if (!updatedSession) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const sessions = await loadUserSessions(req.user.userId);
        const session = sessions.find((item) => item.session_id === updatedSession.session_id);

        return res.json(session ?? mapSessionRow({ ...updatedSession, bookmark_ids: [] }));
    } catch (error) {
        console.error('Update session error:', error);
        return res.status(500).json({ message: 'Unable to update session' });
    }
});

app.delete('/sessions/:id', authenticateToken, async (req, res) => {
    const sessionResult = parseSessionIdParam(req.params.id);

    if (sessionResult.error) {
        return res.status(400).json({ message: sessionResult.error });
    }

    try {
        const deleted = await db.result(
            `DELETE FROM sessions
             WHERE session_id = $1
               AND user_id = $2`,
            [sessionResult.value, req.user.userId],
        );

        if (deleted.rowCount === 0) {
            return res.status(404).json({ message: 'Session not found' });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Delete session error:', error);
        return res.status(500).json({ message: 'Unable to delete session' });
    }
});

app.post('/sessions/:id/bookmarks', authenticateToken, async (req, res) => {
    const sessionResult = parseSessionIdParam(req.params.id);

    if (sessionResult.error) {
        return res.status(400).json({ message: sessionResult.error });
    }

    const bookmarkResult = parseSessionBookmarkId(req.body?.bookmark_id);

    if (bookmarkResult.error) {
        return res.status(400).json({ message: bookmarkResult.error });
    }

    try {
        const session = await getUserSession(req.user.userId, sessionResult.value);

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const bookmark = await getUserBookmark(req.user.userId, bookmarkResult.value);

        if (!bookmark) {
            return res.status(404).json({ message: 'Bookmark not found' });
        }

        const existing = await db.oneOrNone(
            `SELECT session_id
             FROM session_bookmarks
             WHERE session_id = $1
               AND bookmark_id = $2`,
            [sessionResult.value, bookmarkResult.value],
        );

        if (existing) {
            const sessions = await loadUserSessions(req.user.userId);
            const currentSession = sessions.find((item) => item.session_id === sessionResult.value);
            return res.json(currentSession ?? mapSessionRow({ session_id: sessionResult.value, bookmark_ids: [] }));
        }

        const nextPosition = await db.one(
            `SELECT COALESCE(MAX(position), -1) + 1 AS next_position
             FROM session_bookmarks
             WHERE session_id = $1`,
            [sessionResult.value],
        );

        await db.none(
            `INSERT INTO session_bookmarks (session_id, bookmark_id, position)
             VALUES ($1, $2, $3)`,
            [sessionResult.value, bookmarkResult.value, nextPosition.next_position],
        );

        const sessions = await loadUserSessions(req.user.userId);
        const updatedSession = sessions.find((item) => item.session_id === sessionResult.value);

        return res.status(201).json(updatedSession);
    } catch (error) {
        console.error('Add bookmark to session error:', error);
        return res.status(500).json({ message: 'Unable to add bookmark to session' });
    }
});

app.delete('/sessions/:id/bookmarks/:bookmarkId', authenticateToken, async (req, res) => {
    const sessionResult = parseSessionIdParam(req.params.id);
    const bookmarkResult = parseSessionBookmarkId(req.params.bookmarkId);

    if (sessionResult.error) {
        return res.status(400).json({ message: sessionResult.error });
    }

    if (bookmarkResult.error) {
        return res.status(400).json({ message: bookmarkResult.error });
    }

    try {
        const session = await getUserSession(req.user.userId, sessionResult.value);

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const deleted = await db.result(
            `DELETE FROM session_bookmarks
             WHERE session_id = $1
               AND bookmark_id = $2`,
            [sessionResult.value, bookmarkResult.value],
        );

        if (deleted.rowCount === 0) {
            return res.status(404).json({ message: 'Bookmark not in session' });
        }

        const sessions = await loadUserSessions(req.user.userId);
        const updatedSession = sessions.find((item) => item.session_id === sessionResult.value);

        return res.json(updatedSession);
    } catch (error) {
        console.error('Remove bookmark from session error:', error);
        return res.status(500).json({ message: 'Unable to remove bookmark from session' });
    }
});

//MARK: Bookmark CRUD

//MARK: GET requests

//MARK: GET all bookmarks
app.get('/bookmarks', authenticateToken, async (req, res) => {
    try {
        const bookmarks = await db.any(
            `SELECT ${BOOKMARK_SELECT_COLUMNS}
             FROM bookmarks
             WHERE user_id = $1
             ORDER BY bookmark_id DESC`,
            [req.user.userId],
        );

        return res.json(bookmarks);
    } catch (error) {
        console.error('Get bookmarks error:', error);
        return res.status(500).json({ message: 'Unable to fetch bookmarks' });
    }
});
//MARK: GET specific bookmark
app.get('/bookmarks/:id', authenticateToken, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
        return res.status(400).json({ message: 'Invalid bookmark id' });
    }

    try {
        const bookmark = await db.oneOrNone(
            `SELECT ${BOOKMARK_SELECT_COLUMNS}
             FROM bookmarks
             WHERE bookmark_id = $1
               AND user_id = $2`,
            [id, req.user.userId],
        );

        if (!bookmark) {
            return res.status(404).json({ message: 'Bookmark not found' });
        }

        return res.json(bookmark);
    } catch (error) {
        console.error('Get bookmark error:', error);
        return res.status(500).json({ message: 'Unable to fetch bookmark' });
    }
});
//MARK: POST requests
//Create a new bookmark

app.post('/bookmarks', authenticateToken, async (req, res) => {
    const { parsed, errors } = parseBookmarkBody(req.body, { requireAll: true });
    const folderResult = parseBookmarkFolderId(req.body?.folder_id);

    if (errors.length > 0) {
        return res.status(400).json({ message: errors[0] });
    }

    if (folderResult.error) {
        return res.status(400).json({ message: folderResult.error });
    }

    try {
        if (folderResult.value !== null) {
            const folder = await getUserFolder(req.user.userId, folderResult.value);

            if (!folder) {
                return res.status(404).json({ message: 'Folder not found' });
            }
        }

        const bookmark = await db.one(
            `INSERT INTO bookmarks (${BOOKMARK_WRITABLE_FIELDS.join(', ')}, folder_id, user_id)
             VALUES ($1, $2, $3, $4)
             RETURNING ${BOOKMARK_SELECT_COLUMNS}`,
            [
                ...BOOKMARK_WRITABLE_FIELDS.map((field) => parsed[field]),
                folderResult.value,
                req.user.userId,
            ],
        );

        return res.status(201).json(bookmark);
    } catch (error) {
        console.error('Create bookmark error:', error);
        return res.status(500).json({ message: 'Unable to create bookmark' });
    }
});

//MARK: PATCH requests

//Update a given bookmark
app.patch('/bookmarks/:id', authenticateToken, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
        return res.status(400).json({ message: 'Invalid bookmark id' });
    }

    const { parsed, errors } = parseBookmarkBody(req.body, { allowPartial: true });
    const folderResult =
        req.body?.folder_id !== undefined ? parseBookmarkFolderId(req.body.folder_id) : null;

    if (errors.length > 0) {
        return res.status(400).json({ message: errors[0] });
    }

    if (folderResult?.error) {
        return res.status(400).json({ message: folderResult.error });
    }

    const updateFields = BOOKMARK_WRITABLE_FIELDS.filter((field) => parsed[field] !== undefined);
    const values = updateFields.map((field) => parsed[field]);
    const setParts = updateFields.map((field, index) => `${field} = $${index + 1}`);

    if (folderResult) {
        setParts.push(`folder_id = $${setParts.length + 1}`);
        values.push(folderResult.value);
    }

    if (setParts.length === 0) {
        return res.status(400).json({ message: 'At least one field must be provided' });
    }

    const bookmarkIdParam = values.length + 1;
    const userIdParam = values.length + 2;

    try {
        if (folderResult && folderResult.value !== null) {
            const folder = await getUserFolder(req.user.userId, folderResult.value);

            if (!folder) {
                return res.status(404).json({ message: 'Folder not found' });
            }
        }

        const bookmark = await db.oneOrNone(
            `UPDATE bookmarks
             SET ${setParts.join(', ')}
             WHERE bookmark_id = $${bookmarkIdParam}
               AND user_id = $${userIdParam}
             RETURNING ${BOOKMARK_SELECT_COLUMNS}`,
            [...values, id, req.user.userId],
        );

        if (!bookmark) {
            return res.status(404).json({ message: 'Bookmark not found' });
        }

        return res.json(bookmark);
    } catch (error) {
        console.error('Update bookmark error:', error);
        return res.status(500).json({ message: 'Unable to update bookmark' });
    }
});

//MARK: DELETE requests

app.delete('/bookmarks/:id', authenticateToken, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
        return res.status(400).json({ message: 'Invalid bookmark id' });
    }

    try {
        const deleted = await db.tx(async (transaction) => {
            const bookmark = await transaction.oneOrNone(
                `SELECT bookmark_id
                 FROM bookmarks
                 WHERE bookmark_id = $1
                   AND user_id = $2`,
                [id, req.user.userId],
            );

            if (!bookmark) {
                return false;
            }

            await transaction.none(
                'DELETE FROM bookmark_timestamps WHERE bookmark_id = $1',
                [id],
            );
            await transaction.none(
                'DELETE FROM bookmark_page_numbers WHERE bookmark_id = $1',
                [id],
            );
            await transaction.none(
                `DELETE FROM bookmarks
                 WHERE bookmark_id = $1
                   AND user_id = $2`,
                [id, req.user.userId],
            );

            return true;
        });

        if (!deleted) {
            return res.status(404).json({ message: 'Bookmark not found' });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Delete bookmark error:', error);
        return res.status(500).json({ message: 'Unable to delete bookmark' });
    }
});

//MARK: Bookmark timestamps

app.get('/bookmarks/:bookmarkId/timestamps', authenticateToken, async (req, res) => {
    const bookmarkResult = parseBookmarkIdParam(req.params.bookmarkId);

    if (bookmarkResult.error) {
        return res.status(400).json({ message: bookmarkResult.error });
    }

    try {
        const bookmark = await getUserBookmark(req.user.userId, bookmarkResult.value);

        if (!bookmark) {
            return res.status(404).json({ message: 'Bookmark not found' });
        }

        const rows = await db.any(
            `SELECT ${TIMESTAMP_SELECT_COLUMNS}
             FROM bookmark_timestamps
             WHERE bookmark_id = $1
             ORDER BY timestamp_value ASC`,
            [bookmarkResult.value],
        );

        return res.json(rows.map(mapTimestampRow));
    } catch (error) {
        console.error('Get bookmark timestamps error:', error);
        return res.status(500).json({ message: 'Unable to fetch timestamps' });
    }
});

app.post('/bookmarks/:bookmarkId/timestamps', authenticateToken, async (req, res) => {
    const bookmarkResult = parseBookmarkIdParam(req.params.bookmarkId);

    if (bookmarkResult.error) {
        return res.status(400).json({ message: bookmarkResult.error });
    }

    const timestampResult = parseTimestampValue(req.body?.timestamp_value);
    const noteResult = parseNoteContent(req.body?.note_content);

    if (timestampResult.error) {
        return res.status(400).json({ message: timestampResult.error });
    }

    if (noteResult.error) {
        return res.status(400).json({ message: noteResult.error });
    }

    try {
        const bookmark = await getUserBookmark(req.user.userId, bookmarkResult.value);

        if (!bookmark) {
            return res.status(404).json({ message: 'Bookmark not found' });
        }

        const row = await db.one(
            `INSERT INTO bookmark_timestamps (bookmark_id, timestamp_value, note_content)
             VALUES ($1, $2::interval, $3)
             RETURNING ${TIMESTAMP_SELECT_COLUMNS}`,
            [bookmarkResult.value, timestampResult.value, noteResult.value],
        );

        return res.status(201).json(mapTimestampRow(row));
    } catch (error) {
        console.error('Create bookmark timestamp error:', error);
        return res.status(500).json({ message: 'Unable to create timestamp' });
    }
});

app.patch('/bookmarks/:bookmarkId/timestamps', authenticateToken, async (req, res) => {
    const bookmarkResult = parseBookmarkIdParam(req.params.bookmarkId);

    if (bookmarkResult.error) {
        return res.status(400).json({ message: bookmarkResult.error });
    }

    const originalTimestampResult = parseTimestampValue(req.body?.original_timestamp_value);

    if (originalTimestampResult.error) {
        return res.status(400).json({ message: 'Original timestamp is required' });
    }

    const hasTimestampUpdate = req.body?.timestamp_value !== undefined;
    const hasNoteUpdate = req.body?.note_content !== undefined;

    if (!hasTimestampUpdate && !hasNoteUpdate) {
        return res.status(400).json({ message: 'At least one field must be provided' });
    }

    const timestampResult = hasTimestampUpdate
        ? parseTimestampValue(req.body.timestamp_value)
        : null;
    const noteResult = hasNoteUpdate ? parseNoteContent(req.body.note_content) : null;

    if (timestampResult?.error) {
        return res.status(400).json({ message: timestampResult.error });
    }

    if (noteResult?.error) {
        return res.status(400).json({ message: noteResult.error });
    }

    const setParts = [];
    const values = [];

    if (timestampResult) {
        setParts.push(`timestamp_value = $${setParts.length + 1}::interval`);
        values.push(timestampResult.value);
    }

    if (noteResult) {
        setParts.push(`note_content = $${setParts.length + 1}`);
        values.push(noteResult.value);
    }

    const bookmarkIdParam = values.length + 1;
    const originalTimestampParam = values.length + 2;

    try {
        const bookmark = await getUserBookmark(req.user.userId, bookmarkResult.value);

        if (!bookmark) {
            return res.status(404).json({ message: 'Bookmark not found' });
        }

        const row = await db.oneOrNone(
            `UPDATE bookmark_timestamps
             SET ${setParts.join(', ')}
             WHERE bookmark_id = $${bookmarkIdParam}
               AND timestamp_value = $${originalTimestampParam}::interval
             RETURNING ${TIMESTAMP_SELECT_COLUMNS}`,
            [...values, bookmarkResult.value, originalTimestampResult.value],
        );

        if (!row) {
            return res.status(404).json({ message: 'Timestamp not found' });
        }

        return res.json(mapTimestampRow(row));
    } catch (error) {
        console.error('Update bookmark timestamp error:', error);
        return res.status(500).json({ message: 'Unable to update timestamp' });
    }
});

app.delete('/bookmarks/:bookmarkId/timestamps', authenticateToken, async (req, res) => {
    const bookmarkResult = parseBookmarkIdParam(req.params.bookmarkId);

    if (bookmarkResult.error) {
        return res.status(400).json({ message: bookmarkResult.error });
    }

    const timestampResult = parseTimestampValue(req.body?.timestamp_value);

    if (timestampResult.error) {
        return res.status(400).json({ message: timestampResult.error });
    }

    try {
        const bookmark = await getUserBookmark(req.user.userId, bookmarkResult.value);

        if (!bookmark) {
            return res.status(404).json({ message: 'Bookmark not found' });
        }

        const deleted = await db.result(
            `DELETE FROM bookmark_timestamps
             WHERE bookmark_id = $1
               AND timestamp_value = $2::interval`,
            [bookmarkResult.value, timestampResult.value],
        );

        if (deleted.rowCount === 0) {
            return res.status(404).json({ message: 'Timestamp not found' });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Delete bookmark timestamp error:', error);
        return res.status(500).json({ message: 'Unable to delete timestamp' });
    }
});

//MARK: Bookmark page numbers

app.get('/bookmarks/:bookmarkId/page-numbers', authenticateToken, async (req, res) => {
    const bookmarkResult = parseBookmarkIdParam(req.params.bookmarkId);

    if (bookmarkResult.error) {
        return res.status(400).json({ message: bookmarkResult.error });
    }

    try {
        const bookmark = await getUserBookmark(req.user.userId, bookmarkResult.value);

        if (!bookmark) {
            return res.status(404).json({ message: 'Bookmark not found' });
        }

        const rows = await db.any(
            `SELECT ${PAGE_NUMBER_SELECT_COLUMNS}
             FROM bookmark_page_numbers
             WHERE bookmark_id = $1
             ORDER BY page_number ASC`,
            [bookmarkResult.value],
        );

        return res.json(rows.map(mapPageNumberRow));
    } catch (error) {
        console.error('Get bookmark page numbers error:', error);
        return res.status(500).json({ message: 'Unable to fetch page numbers' });
    }
});

app.post('/bookmarks/:bookmarkId/page-numbers', authenticateToken, async (req, res) => {
    const bookmarkResult = parseBookmarkIdParam(req.params.bookmarkId);

    if (bookmarkResult.error) {
        return res.status(400).json({ message: bookmarkResult.error });
    }

    const pageNumberResult = parsePageNumber(req.body?.page_number);
    const noteResult = parseNoteContent(req.body?.note_content);

    if (pageNumberResult.error) {
        return res.status(400).json({ message: pageNumberResult.error });
    }

    if (noteResult.error) {
        return res.status(400).json({ message: noteResult.error });
    }

    try {
        const bookmark = await getUserBookmark(req.user.userId, bookmarkResult.value);

        if (!bookmark) {
            return res.status(404).json({ message: 'Bookmark not found' });
        }

        const row = await db.one(
            `INSERT INTO bookmark_page_numbers (bookmark_id, page_number, note_content)
             VALUES ($1, $2, $3)
             RETURNING ${PAGE_NUMBER_SELECT_COLUMNS}`,
            [bookmarkResult.value, pageNumberResult.value, noteResult.value],
        );

        return res.status(201).json(mapPageNumberRow(row));
    } catch (error) {
        console.error('Create bookmark page number error:', error);
        return res.status(500).json({ message: 'Unable to create page number' });
    }
});

app.patch('/bookmarks/:bookmarkId/page-numbers', authenticateToken, async (req, res) => {
    const bookmarkResult = parseBookmarkIdParam(req.params.bookmarkId);

    if (bookmarkResult.error) {
        return res.status(400).json({ message: bookmarkResult.error });
    }

    const originalPageNumberResult = parsePageNumber(req.body?.original_page_number);

    if (originalPageNumberResult.error) {
        return res.status(400).json({ message: 'Original page number is required' });
    }

    const hasPageNumberUpdate = req.body?.page_number !== undefined;
    const hasNoteUpdate = req.body?.note_content !== undefined;

    if (!hasPageNumberUpdate && !hasNoteUpdate) {
        return res.status(400).json({ message: 'At least one field must be provided' });
    }

    const pageNumberResult = hasPageNumberUpdate
        ? parsePageNumber(req.body.page_number)
        : null;
    const noteResult = hasNoteUpdate ? parseNoteContent(req.body.note_content) : null;

    if (pageNumberResult?.error) {
        return res.status(400).json({ message: pageNumberResult.error });
    }

    if (noteResult?.error) {
        return res.status(400).json({ message: noteResult.error });
    }

    const setParts = [];
    const values = [];

    if (pageNumberResult) {
        setParts.push(`page_number = $${setParts.length + 1}`);
        values.push(pageNumberResult.value);
    }

    if (noteResult) {
        setParts.push(`note_content = $${setParts.length + 1}`);
        values.push(noteResult.value);
    }

    const bookmarkIdParam = values.length + 1;
    const originalPageNumberParam = values.length + 2;

    try {
        const bookmark = await getUserBookmark(req.user.userId, bookmarkResult.value);

        if (!bookmark) {
            return res.status(404).json({ message: 'Bookmark not found' });
        }

        const row = await db.oneOrNone(
            `UPDATE bookmark_page_numbers
             SET ${setParts.join(', ')}
             WHERE bookmark_id = $${bookmarkIdParam}
               AND page_number = $${originalPageNumberParam}
             RETURNING ${PAGE_NUMBER_SELECT_COLUMNS}`,
            [...values, bookmarkResult.value, originalPageNumberResult.value],
        );

        if (!row) {
            return res.status(404).json({ message: 'Page number not found' });
        }

        return res.json(mapPageNumberRow(row));
    } catch (error) {
        console.error('Update bookmark page number error:', error);
        return res.status(500).json({ message: 'Unable to update page number' });
    }
});

app.delete('/bookmarks/:bookmarkId/page-numbers', authenticateToken, async (req, res) => {
    const bookmarkResult = parseBookmarkIdParam(req.params.bookmarkId);

    if (bookmarkResult.error) {
        return res.status(400).json({ message: bookmarkResult.error });
    }

    const pageNumberResult = parsePageNumber(req.body?.page_number);

    if (pageNumberResult.error) {
        return res.status(400).json({ message: pageNumberResult.error });
    }

    try {
        const bookmark = await getUserBookmark(req.user.userId, bookmarkResult.value);

        if (!bookmark) {
            return res.status(404).json({ message: 'Bookmark not found' });
        }

        const deleted = await db.result(
            `DELETE FROM bookmark_page_numbers
             WHERE bookmark_id = $1
               AND page_number = $2`,
            [bookmarkResult.value, pageNumberResult.value],
        );

        if (deleted.rowCount === 0) {
            return res.status(404).json({ message: 'Page number not found' });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Delete bookmark page number error:', error);
        return res.status(500).json({ message: 'Unable to delete page number' });
    }
});

//MARK: Start server
app.listen(port, () => {
    console.log(`Coalition backend API is listening on port ${port}`);
});