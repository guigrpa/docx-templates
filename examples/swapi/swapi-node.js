require('isomorphic-fetch');
const createReport = require('../../lib');

createReport({
  template: process.argv[2],
  data: query =>
    fetch('http://swapi.apis.guru', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })
    .then(res => res.json())
    .then(res => res.data),
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
