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
    parseFolderName,
    parseParentId,
} = require('./folderFields');

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

    const nameResult = parseFolderName(req.body?.name);

    if (nameResult.error) {
        return res.status(400).json({ message: nameResult.error });
    }

    try {
        const folder = await db.oneOrNone(
            `UPDATE folders
             SET name = $1
             WHERE folder_id = $2
               AND user_id = $3
             RETURNING ${FOLDER_SELECT_COLUMNS}`,
            [nameResult.value, id, req.user.userId],
        );

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        return res.json(folder);
    } catch (error) {
        console.error('Rename folder error:', error);
        return res.status(500).json({ message: 'Unable to rename folder' });
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

//MARK: Start server
app.listen(port, () => {
    console.log(`Coalition backend API is listening on port ${port}`);
});