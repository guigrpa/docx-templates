const path = require('path');
const createReport = require('../../../lib/').default;

const LONG_TEXT = `Lorem ipsum ||<w:br/>||dolor sit amet, consectetur adipiscing elit. Sed commodo sagittis erat, sed vehicula lorem molestie et. Sed eget nisi orci. Fusce ut scelerisque neque. Donec porta eleifend dolor. Morbi in egestas augue. Nunc non velit at nisl faucibus ultrices. Aenean ac lacinia tortor. Nunc elementum enim ut viverra maximus. Pellentesque et metus posuere, feugiat nulla in, feugiat mauris. Suspendisse eu urna aliquam, molestie ante at, convallis justo.
Nullam hendrerit quam sit amet nunc tincidunt dictum. Praesent hendrerit at quam ac fermentum. Donec rutrum enim lacus, mollis imperdiet ex posuere ac. Sed vel ullamcorper massa. Duis non posuere mauris. Etiam purus turpis, fermentum a rhoncus et, rutrum in nisl. Aliquam pharetra sit amet lectus sed bibendum. Sed sem ipsum, placerat a nisl vitae, pharetra mattis libero. Nunc finibus purus id consectetur sagittis. Pellentesque ornare egestas lacus, in blandit diam facilisis eget. Morbi nec ligula id ligula tincidunt tincidunt vulputate id erat. Quisque ut eros et sem pharetra placerat a vel leo. Praesent accumsan neque imperdiet, facilisis ipsum interdum, aliquam mi. Sed posuere purus eu sagittis aliquam.
Morbi dignissim consequat ex, non finibus est faucibus sodales. Integer sed justo mollis, fringilla ipsum tempor, laoreet elit. Nullam iaculis finibus nulla a commodo. Curabitur nec suscipit velit, vitae lobortis mauris. Integer ac bibendum quam, eget pretium justo. Ut finibus, sem sed pharetra dictum, metus mauris tristique justo, sed congue erat mi a leo. Aliquam dui arcu, gravida quis magna ac, volutpat blandit felis. Morbi quis lobortis tortor. Cras pulvinar feugiat metus nec commodo. Sed sollicitudin risus vel risus finibus, sit amet pretium sapien fermentum. Nulla accumsan ullamcorper felis, quis tempor dolor. Praesent blandit ullamcorper pretium. Ut viverra molestie dui.`;

createReport({
  template: path.join(__dirname, 'longText.docx'),
  data: { longText: LONG_TEXT },
  // data: { a: 'foo', b: 'bar' },
  // data: { foo: 'bar' },
  // data: { companies: [
  //   {
  //     name: 'FIRST',
  //     people: [
  //       { firstName: 'Pep', projects: [{ name: 'one' }, { name: 'two' }] },
  //       { firstName: 'Fidel', projects: [{ name: 'three' }] },
  //     ],
  //   },
  //   {
  //     name: 'SECOND',
  //     people: [
  //       { firstName: 'Albert', projects: [] },
  //       { firstName: 'Xavi', projects: [] },
  //     ],
  //   },
  //   {
  //     name: 'THIRD',
  //     people: [],
  //   },
  // ] },
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
