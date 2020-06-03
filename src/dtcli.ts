// trivial CLI useful for testing

// usage:
// npm run-script compile
// node lib/dtcli.js myTemplate.docx myContext.json myOutfile.docx

import createReport from './index';
import { Node, TextNode, NonTextNode } from './types';
const fs = require('fs');

const template = fs.readFileSync(process.argv[2]);
const context = fs.readFileSync(process.argv[3], 'utf-8');

const buffer = createReport({
  template,
  data: JSON.parse(context),

  postProcessor: (rootNodeOrig, filename) => {
    console.log(`*** postProcessor running on ${filename}`);

    if (
      !['word/header1.xml', 'word/header2.xml', 'word/header3.xml'].includes(
        filename
      )
    ) {
      return rootNodeOrig;
    }

    // let's do a deepcopy that strips a w:r element that contains //> v:textpath string=DRAFT

    let hasChildrenNamed = function (mythis: Node, wantedname: string) {
      if (
        mythis._children &&
        mythis._children.length &&
        mythis._children.filter(x => !x._fTextNode && x._tag === wantedname)
      ) {
        return mythis._children.filter(
          x => !x._fTextNode && x._tag === wantedname
        );
      } else {
        return [];
      }
    };

    // we want to match a w:r /> w:pict /> v:shape /> v:textpath hasAttrValue "string" "DRAFT"
    let rootNodeOut = deepCopyNode(
      rootNodeOrig,
      (n: Node) =>
        !n._fTextNode &&
        n._tag === 'w:r' &&
        hasChildrenNamed(n, 'w:pict').filter(x => {
          return hasChildrenNamed(x, 'v:shape').filter(y => {
            return hasChildrenNamed(y, 'v:textpath').filter(z => {
              if (z._attrs && z._attrs.string === 'DRAFT') {
                // console.log(`found an undesirable!`)
                return true;
              } else return false;
            });
          });
        })
    );

    return rootNodeOut;
  },
})
  .then(function (data: any) {
    console.log('done');
    fs.writeFileSync(process.argv[4], data);
  })
  .catch(function (error: any) {
    console.log(error);
  });

function deepCopyNode(
  orig: Node,
  undesirable: (n: Node) => boolean
): TextNode | NonTextNode {
  let newNode;
  let copy = {
    _ifName: orig._ifName,
    _fTextNode: orig._fTextNode,
    _children: orig._children
      .filter(x => !undesirable(x))
      .map(x => deepCopyNode(x, undesirable)),
  };
  if (orig._fTextNode) {
    newNode = <TextNode>{ _text: orig._text, ...copy };
  } else {
    newNode = <NonTextNode>{ _tag: orig._tag, ...copy, _attrs: orig._attrs };
  }

  for (var child of newNode._children) {
    child._parent = newNode;
  }

  return newNode;
}
