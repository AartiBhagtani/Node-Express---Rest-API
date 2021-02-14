const express = require('express');
const bodyPraser = require('body-parser');

const feedRoutes = require('./routes/feed');


const app = express();

// app.use(bodyPraser.urlencoded()); // to parse data from x-www-form-urlEncoded via <form>
app.use(bodyPraser.json()); //application json

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/feed', feedRoutes)

app.listen(8080);