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
} = require('./bookmarkFields');

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

    if (errors.length > 0) {
        return res.status(400).json({ message: errors[0] });
    }

    try {
        const bookmark = await db.one(
            `INSERT INTO bookmarks (${BOOKMARK_WRITABLE_FIELDS.join(', ')}, user_id)
             VALUES ($1, $2, $3)
             RETURNING ${BOOKMARK_SELECT_COLUMNS}`,
            [...BOOKMARK_WRITABLE_FIELDS.map((field) => parsed[field]), req.user.userId],
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

    if (errors.length > 0) {
        return res.status(400).json({ message: errors[0] });
    }

    const updateFields = BOOKMARK_WRITABLE_FIELDS.filter((field) => parsed[field] !== undefined);

    if (updateFields.length === 0) {
        return res.status(400).json({ message: 'At least one field must be provided' });
    }

    const setClause = updateFields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const values = updateFields.map((field) => parsed[field]);

    try {
        const bookmark = await db.oneOrNone(
            `UPDATE bookmarks
             SET ${setClause}
             WHERE bookmark_id = $${updateFields.length + 1}
               AND user_id = $${updateFields.length + 2}
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