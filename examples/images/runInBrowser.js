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

app.listen(port, err => {
  if (err) throw new Error('Could not start listening');
  console.log(`server is listening on ${port}`);
});
