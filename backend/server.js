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

        const token = jwt.sign({ userId: user.user_id, username: user.username }, process.env.JWT_SECRET || 'dev-secret', {
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

        const token = jwt.sign({ userId: createdUser.user_id, username: createdUser.username }, process.env.JWT_SECRET || 'dev-secret', {
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
app.get('/bookmarks', (req, res) => {

    const query = 'SELECT * FROM bookmarks';
    db.any(query).then((data) => {

        console.log("Sending: ", data);
        res.json(data);
    });

});
//MARK: GET specific bookmark
app.get('/bookmarks/:id', (req, res) => {
    const id = req.params.id;

    const query = 'SELECT * FROM bookmarks WHERE bookmark_id = $1'
    db.any(query, id).then((data) => {

        console.log("Sending: ", data);

        res.json(data);
    })
});
//MARK: POST requests
//Create a new bookmark

app.post('/bookmarks',  (req, res) => {
    const bookmarkName = req.body.name;
    const bookmarkUrl = req.body.url;
})

//MARK: PATCH requests

//Update a given bookmark
app.patch('/bookmarks/:id', (req, res) => {
    //TODO: Figure out how to dynamically update columns depending on what information is and / or isn't updated

});

//MARK: Start server
app.listen(port, () => {
    console.log(`Coalition backend API is listening on port ${port}`);
});