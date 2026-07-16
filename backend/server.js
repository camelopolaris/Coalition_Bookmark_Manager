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

app.use(cors({origin: "http://localhost:5173"}));

const port = 3000;
//db contains initialized database with config information
const db = require('./postgresConfig');

app.get('/', (req, res) => {

    res.json("Coalition backend API running!");
});
//MARK: Auth
app.post('/login', (req, res)=>{
    const {username, password} = req.body
    const query = 'SELECT user_id, username FROM users WHERE username = $1 AND password = crypt($2, password);'

    db.any(query, [username, password]).then((data)=>{
        console.log("User login successful: ", data)
    })
    
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