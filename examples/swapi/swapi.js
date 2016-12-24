const path = require('path');
const createReport = require('../../lib');
const fetch = require('isomorphic-fetch');

createReport({
  template: path.join(__dirname, 'swapi.docx'),
  data: (query) =>
    fetch('http://graphql-swapi.parseapp.com', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })
    .then((res) => res.json())
    .then((res) => res.data),
});

/*
{
  allFilms {
    edges {
      node {
        title
      }
    }
  }
}
 */
