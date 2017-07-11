// @flow

import { insertTextSiblingAfter, getNextSibling } from './reportUtils';
import type { Node, CreateReportOptions } from './types';

// In-place
// In case of split commands (or even split delimiters), joins all the pieces
// at the starting node
const preprocessTemplate = (template: Node, options: CreateReportOptions) => {
  const { cmdDelimiter: delimiter } = options;
  let node: ?Node = template;
  let fCmd = false;
  let openNode = null;
  let idxDelimiter = 0;
  const placeholderCmd = `${delimiter}CMD_NODE${delimiter}`;

  while (node != null) {
    // Add `xml:space` attr `preserve` to `w:t` tags
    if (!node._fTextNode && node._tag === 'w:t') {
      node._attrs['xml:space'] = 'preserve';
    }

    // Add a space if we reach a new `w:p` tag and there's an open node (hence, in a command)
    if (!node._fTextNode && node._tag === 'w:p' && openNode) {
      openNode._text += ' ';
    }

    // Process text nodes inside `w:t` tags
    if (
      node._fTextNode &&
      node._parent &&
      !node._parent._fTextNode && // Flow, don't complain
      node._parent._tag === 'w:t'
    ) {
      if (openNode == null) openNode = node;
      const textIn = node._text;
      node._text = '';
      for (let i = 0; i < textIn.length; i++) {
        const c = textIn[i];

        // Matches the expected delimiter character
        if (c === delimiter[idxDelimiter]) {
          idxDelimiter += 1;

          // Finished matching delimiter? Then toggle `fCmd`,
          // add a new `w:t` + text node (either before or after the delimiter),
          // depending on the case
          if (idxDelimiter === delimiter.length) {
            fCmd = !fCmd;
            const fNodesMatch = node === openNode;
            if (fCmd && openNode._text.length) {
              openNode = insertTextSiblingAfter(openNode);
              if (fNodesMatch) node = openNode;
            }
            openNode._text += delimiter;
            if (!fCmd && i < textIn.length - 1) {
              openNode = insertTextSiblingAfter(openNode);
              if (fNodesMatch) node = openNode;
            }
            idxDelimiter = 0;
            if (!fCmd) openNode = node; // may switch open node to the current one
          }

          // Doesn't match the delimiter, but we had some partial match
        } else if (idxDelimiter) {
          openNode._text += delimiter.slice(0, idxDelimiter);
          idxDelimiter = 0;
          if (!fCmd) openNode = node;
          openNode._text += c;

          // General case
        } else {
          openNode._text += c;
        }
      }

      // Close the text node if nothing's pending
      if (!fCmd && !idxDelimiter) openNode = null;

      // If text was present but not any more, add a placeholder, so that this node
      // will be purged during report generation
      if (textIn.length && !node._text.length) node._text = placeholderCmd;
    }

    // Find next node to process
    if (node._children.length) node = node._children[0];
    else {
      let fFound = false;
      while (node._parent != null) {
        const nodeParent: Node = node._parent;
        const nextSibling = getNextSibling(node);
        if (nextSibling) {
          fFound = true;
          node = nextSibling;
          break;
        }
        node = nodeParent;
      }
      if (!fFound) node = null;
    }
  }
  return template;
};

// ==========================================
// Public API
// ==========================================
export default preprocessTemplate;
