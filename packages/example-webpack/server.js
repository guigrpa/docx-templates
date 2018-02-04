/* eslint-disable no-console */

require('isomorphic-fetch');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 30000;
console.log(
  'Make sure your GITHUB_API_KEY envvar is correctly set up if you use the GitHub API in your template'
);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile('index.html');
});

app.post('/github', (req, res) => {
  fetch('https://api.github.com/graphql', {
    method: 'post',
    headers: {
      Authorization: `bearer ${process.env.GITHUB_API_KEY}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req.body),
  })
    .then(response => response.json())
    .then(data => {
      console.log(data);
      return res.json(data.data);
    });
});

app.listen(port, err => {
  if (err) {
    console.error('something bad happened', err);
    return;
  }
  console.log(`server is listening on ${port}`);
});
