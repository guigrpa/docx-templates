const createReport = require('../../lib');
require('isomorphic-fetch');

createReport({
  template: process.argv[2],
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
