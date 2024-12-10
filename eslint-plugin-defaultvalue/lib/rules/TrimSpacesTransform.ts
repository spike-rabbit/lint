/* eslint-disable no-case-declarations, headers/header-format */
// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

// Copy from upstream. Should be dropped when the upstream is fixed.

import { type DocNode, DocNodeKind, DocParagraph, DocPlainText } from '@microsoft/tsdoc';

/**
 * Implementation of DocNodeTransforms.trimSpacesInParagraphNodes()
 */
export class TrimSpacesTransform {
  public static transform(docParagraph: DocParagraph): DocParagraph {
    const transformedNodes: DocNode[] = [];

    // Whether the next nonempty node to be added needs a space before it
    let pendingSpace = false;

    // The DocPlainText node that we're currently accumulating
    const accumulatedTextChunks: string[] = [];
    const accumulatedNodes: DocNode[] = [];

    // We always trim leading whitespace for a paragraph.  This flag gets set to true
    // as soon as nonempty content is encountered.
    let finishedSkippingLeadingSpaces = false;

    for (const node of docParagraph.nodes) {
      switch (node.kind) {
        case DocNodeKind.PlainText:
          const docPlainText: DocPlainText = node as DocPlainText;

          const text: string = docPlainText.text;

          const startedWithSpace: boolean = /^\s/.test(text);
          const endedWithSpace: boolean = /\s$/.test(text);
          const collapsedText: string = text.replace(/\s+/g, ' ').trim();

          if (startedWithSpace && finishedSkippingLeadingSpaces) {
            pendingSpace = true;
          }

          if (collapsedText.length > 0) {
            if (pendingSpace) {
              accumulatedTextChunks.push(' ');
              pendingSpace = false;
            }

            accumulatedTextChunks.push(collapsedText);
            accumulatedNodes.push(node);

            finishedSkippingLeadingSpaces = true;
          }

          if (endedWithSpace && finishedSkippingLeadingSpaces) {
            pendingSpace = true;
          }
          break;
        case DocNodeKind.SoftBreak:
          if (finishedSkippingLeadingSpaces) {
            pendingSpace = false;
          }
          this.finishNode(
            accumulatedTextChunks,
            transformedNodes,
            docParagraph,
            accumulatedNodes,
            node
          );
          break;
        default:
          if (pendingSpace) {
            accumulatedTextChunks.push(' ');
            pendingSpace = false;
          }
          this.finishNode(
            accumulatedTextChunks,
            transformedNodes,
            docParagraph,
            accumulatedNodes,
            node
          );
          finishedSkippingLeadingSpaces = true;
      }
    }

    // Push the accumulated text
    if (accumulatedTextChunks.length > 0) {
      transformedNodes.push(
        new DocPlainText({
          configuration: docParagraph.configuration,
          text: accumulatedTextChunks.join('')
        })
      );
      accumulatedTextChunks.length = 0;
      accumulatedNodes.length = 0;
    }

    const transformedParagraph: DocParagraph = new DocParagraph({
      configuration: docParagraph.configuration
    });
    transformedParagraph.appendNodes(transformedNodes);
    return transformedParagraph;
  }

  private static finishNode(
    accumulatedTextChunks: string[],
    transformedNodes: DocNode[],
    docParagraph: DocParagraph,
    accumulatedNodes: DocNode[],
    node: DocNode
  ): void {
    // Push the accumulated text
    if (accumulatedTextChunks.length > 0) {
      // TODO: We should probably track the accumulatedNodes somehow, e.g. so we can map them back to the
      // original excerpts.  But we need a developer scenario before we can design this API.
      transformedNodes.push(
        new DocPlainText({
          configuration: docParagraph.configuration,
          text: accumulatedTextChunks.join('')
        })
      );
      accumulatedTextChunks.length = 0;
      accumulatedNodes.length = 0;
    }

    transformedNodes.push(node);
  }
}
