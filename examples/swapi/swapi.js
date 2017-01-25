const createReport = require('../../lib');
require('isomorphic-fetch');

createReport({
  template: process.argv[2],
  data: () => {},
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
