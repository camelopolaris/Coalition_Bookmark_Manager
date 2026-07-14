const express = require('express');

//Initialize app
const app = express();

//Initialize express-validator
const { query } = require('express-validator');

const port = 3000;
//db contains initialized database with config information
const db = require('./postgresConfig');

app.get('/', (req, res) => {

    res.json("Coalition backend API running!");
});
//MARK: Auth

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


//MARK: PATCH requests

//Update a given bookmark
app.patch('/bookmarks/:id', (req, res)=>{
    
});

//MARK: Start server
app.listen(port, () => {
    console.log(`Coalition backend API is listening on port ${port}`);
});