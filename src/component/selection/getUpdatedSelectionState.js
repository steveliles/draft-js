/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule getUpdatedSelectionState
 * @format
 * @flow
 */

'use strict';

import type EditorState from 'EditorState';
import type SelectionState from 'SelectionState';

var DraftOffsetKey = require('DraftOffsetKey');

var nullthrows = require('nullthrows');

function getUpdatedSelectionState(
  editorState: EditorState,
  anchorKey: string,
  anchorOffset: number,
  focusKey: string,
  focusOffset: number,
): SelectionState {
  var selection: SelectionState = nullthrows(editorState.getSelection());
  if (__DEV__) {
    if (!anchorKey || !focusKey) {
      /*eslint-disable no-console */
      console.warn('Invalid selection state.', arguments, editorState.toJS());
      /*eslint-enable no-console */
      return selection;
    }
  }

  var anchorPath = DraftOffsetKey.decode(anchorKey);
  var anchorBlockKey = anchorPath.blockKey;
  var anchorLeaf = editorState
    .getBlockTree(anchorBlockKey)
    .getIn([anchorPath.decoratorKey, 'leaves', anchorPath.leafKey]);

  var focusPath = DraftOffsetKey.decode(focusKey);
  var focusBlockKey = focusPath.blockKey;
  var focusLeaf = editorState
    .getBlockTree(focusBlockKey)
    .getIn([focusPath.decoratorKey, 'leaves', focusPath.leafKey]);

  var anchorLeafStart: number = anchorLeaf.get('start');
  var focusLeafStart: number = focusLeaf.get('start');

  var anchorBlockOffset = anchorLeaf ? anchorLeafStart + anchorOffset : null;
  var focusBlockOffset = focusLeaf ? focusLeafStart + focusOffset : null;

  var areEqual =
    selection.getAnchorKey() === anchorBlockKey &&
    selection.getAnchorOffset() === anchorBlockOffset &&
    selection.getFocusKey() === focusBlockKey &&
    selection.getFocusOffset() === focusBlockOffset;

  if (areEqual) {
    return selection;
  }

  var isBackward = false;
  if (anchorBlockKey === focusBlockKey) {
    var anchorLeafEnd: number = anchorLeaf.get('end');
    var focusLeafEnd: number = focusLeaf.get('end');
    if (focusLeafStart === anchorLeafStart && focusLeafEnd === anchorLeafEnd) {
      isBackward = focusOffset < anchorOffset;
    } else {
      isBackward = focusLeafStart < anchorLeafStart;
    }
  } else {
    var startKey = editorState
      .getCurrentContent()
      .getBlockMap()
      .keySeq()
      .skipUntil(v => v === anchorBlockKey || v === focusBlockKey)
      .first();
    isBackward = startKey === focusBlockKey;
  }

  return selection.merge({
    anchorKey: anchorBlockKey,
    anchorOffset: anchorBlockOffset,
    focusKey: focusBlockKey,
    focusOffset: focusBlockOffset,
    isBackward,
  });
}

module.exports = getUpdatedSelectionState;
