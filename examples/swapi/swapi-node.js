require('isomorphic-fetch');
const createReport = require('../../lib/indexNode');

createReport({
  template: process.argv[2],
  output: process.argv.length > 3 ? process.argv[3] : null,
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
