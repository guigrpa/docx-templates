/* eslint-disable no-console */

require('isomorphic-fetch');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 30000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'www')));

app.get('/', (req, res) => {
  res.sendFile('index.html');
});

app.post('/swapi', (req, res) => {
  fetch('http://swapi.apis.guru', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req.body),
  })
    .then(response => response.json())
    .then(data => res.send(data.data));
});

app.listen(port, err => {
  if (err) {
    console.error('something bad happened', err);
    return;
  }
  console.log(`server is listening on ${port}`);
});
