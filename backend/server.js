const express = require('express');

//Initialize app
const app = express();

//Initialize express-validator
const { query } = require('express-validator'); 

const port = 3000;
//db contains initialized database with config information
const db = require('./postgresConfig');

app.get('/', (req, res) =>{

    res.json("Coalition backend API running!");
});

app.get('/bookmarks', (req, res) => {
 
    const query = 'SELECT * FROM bookmarks';
    db.any(query).then((data)=>{

        console.log("Sending: ", data);
        res.json(data);
    });
    
});

//TODO: Finish endpoint for getting details of a specific bookmark
app.get('/bookmark/{id}', (req, res) => {

});

app.listen(port, ()=>{
    console.log(`Coalition backend API is listening on port ${port}`);
});