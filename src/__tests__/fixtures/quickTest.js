const path = require('path');
const createReport = require('../../../lib/').default;

createReport({
  template: path.join(__dirname, 'for1inline.docx'),
  // data: { a: 'foo', b: 'bar' },
  // data: { foo: 'bar' },
  data: { companies: [
    {
      name: 'FIRST',
      people: [
        { firstName: 'Pep', projects: [{ name: 'one' }, { name: 'two' }] },
        { firstName: 'Fidel', projects: [{ name: 'three' }] },
      ],
    },
    {
      name: 'SECOND',
      people: [
        { firstName: 'Albert', projects: [] },
        { firstName: 'Xavi', projects: [] },
      ],
    },
    {
      name: 'THIRD',
      people: [],
    },
  ] },
  // data: { project: {
  //   name: 'docx-templates',
  //   workPackages: [
  //     {
  //       acronym: 'WP1',
  //       title: 'Work Package 1',
  //       startMilestone: { acronym: 'M1', plannedDelta: '0 m' },
  //       endMilestone: { acronym: 'M2', plannedDelta: '2 m' },
  //       leaderCompany: { acronym: 'me' },
  //     },
  //     {
  //       acronym: 'WP2',
  //       title: 'Work Package 2',
  //       startMilestone: { acronym: 'M2', plannedDelta: '2 m' },
  //       endMilestone: { acronym: 'M3', plannedDelta: '4 m' },
  //       leaderCompany: {},
  //     },
  //   ],
  // } },
});
