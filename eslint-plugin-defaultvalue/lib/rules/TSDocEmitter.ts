/* eslint-disable no-case-declarations, headers/header-format */
// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

// Copy from upstream. Should be dropped when the upstream is fixed.
// See:https://github.com/microsoft/tsdoc/pull/427

import {
  DocBlock,
  DocBlockTag,
  DocCodeSpan,
  DocComment,
  DocDeclarationReference,
  DocErrorText,
  DocEscapedText,
  DocFencedCode,
  DocHtmlAttribute,
  DocHtmlEndTag,
  DocHtmlStartTag,
  DocInheritDocTag,
  DocInlineTag,
  DocInlineTagBase,
  DocLinkTag,
  DocMemberIdentifier,
  DocMemberReference,
  DocMemberSelector,
  DocMemberSymbol,
  DocNode,
  DocNodeKind,
  DocParagraph,
  DocParamBlock,
  DocParamCollection,
  DocPlainText,
  DocSection,
  IStringBuilder,
  StandardTags
} from '@microsoft/tsdoc';

import { TrimSpacesTransform } from './TrimSpacesTransform.js';

enum LineState {
  Closed,
  StartOfLine,
  MiddleOfLine
}

/**
 * Renders a DocNode tree as a code comment.
 */
export class TSDocEmitter {
  public readonly eol: string = '\n';

  // Whether to emit the /** */ framing
  private _emitCommentFraming = true;

  private _output: IStringBuilder | undefined;

  // This state machine is used by the writer functions to generate the /** */ framing around the emitted lines
  private _lineState: LineState = LineState.Closed;

  // State for ensureLineSkipped()
  private _previousLineHadContent = false;

  // Normally a paragraph is precede by a blank line (unless it's the first thing written).
  // But sometimes we want the paragraph to be attached to the previous element, e.g. when it's part of
  // an "@param" block.  Setting _hangingParagraph=true accomplishes that.
  private _hangingParagraph = false;

  public renderComment(output: IStringBuilder, docComment: DocComment): void {
    this._emitCommentFraming = true;
    this.renderCompleteObject(output, docComment);
  }

  public renderHtmlTag(output: IStringBuilder, htmlTag: DocHtmlStartTag | DocHtmlEndTag): void {
    this._emitCommentFraming = false;
    this.renderCompleteObject(output, htmlTag);
  }

  public renderDeclarationReference(
    output: IStringBuilder,
    declarationReference: DocDeclarationReference
  ): void {
    this._emitCommentFraming = false;
    this.renderCompleteObject(output, declarationReference);
  }

  private renderCompleteObject(output: IStringBuilder, docNode: DocNode): void {
    this._output = output;

    this._lineState = LineState.Closed;
    this._previousLineHadContent = false;
    this._hangingParagraph = false;

    this.renderNode(docNode);

    this.writeEnd();
  }

  private renderNode(docNode: DocNode | undefined): void {
    if (docNode === undefined) {
      return;
    }

    switch (docNode.kind) {
      case DocNodeKind.Block:
        const docBlock: DocBlock = docNode as DocBlock;
        this.ensureLineSkipped();
        this.renderNode(docBlock.blockTag);

        if (
          docBlock.blockTag.tagNameWithUpperCase === StandardTags.returns.tagNameWithUpperCase ||
          // fix in https://github.com/microsoft/tsdoc/pull/427
          docBlock.blockTag.tagNameWithUpperCase ===
            StandardTags.defaultValue.tagNameWithUpperCase ||
          // to be fixed in a future MR once the other was merged
          docBlock.blockTag.tagNameWithUpperCase === StandardTags.deprecated.tagNameWithUpperCase
        ) {
          this.writeContent(' ');
          this._hangingParagraph = true;
        }

        this.renderNode(docBlock.content);
        break;

      case DocNodeKind.BlockTag:
        const docBlockTag: DocBlockTag = docNode as DocBlockTag;
        if (this._lineState === LineState.MiddleOfLine) {
          this.writeContent(' ');
        }
        this.writeContent(docBlockTag.tagName);
        break;

      case DocNodeKind.CodeSpan:
        const docCodeSpan: DocCodeSpan = docNode as DocCodeSpan;
        this.writeContent('`');
        this.writeContent(docCodeSpan.code);
        this.writeContent('`');
        break;

      case DocNodeKind.Comment:
        const docComment: DocComment = docNode as DocComment;
        this.renderNodes([
          docComment.summarySection,
          docComment.remarksBlock,
          docComment.privateRemarks,
          docComment.deprecatedBlock,
          docComment.params,
          docComment.typeParams,
          docComment.returnsBlock,
          ...docComment.customBlocks,
          ...docComment.seeBlocks,
          docComment.inheritDocTag
        ]);
        if (docComment.modifierTagSet.nodes.length > 0) {
          this.ensureLineSkipped();
          this.renderNodes(docComment.modifierTagSet.nodes);
        }
        break;

      case DocNodeKind.DeclarationReference:
        const docDeclarationReference: DocDeclarationReference = docNode as DocDeclarationReference;
        this.writeContent(docDeclarationReference.packageName);
        this.writeContent(docDeclarationReference.importPath);
        if (
          docDeclarationReference.packageName !== undefined ||
          docDeclarationReference.importPath !== undefined
        ) {
          this.writeContent('#');
        }
        this.renderNodes(docDeclarationReference.memberReferences);
        break;

      case DocNodeKind.ErrorText:
        const docErrorText: DocErrorText = docNode as DocErrorText;
        this.writeContent(docErrorText.text);
        break;

      case DocNodeKind.EscapedText:
        const docEscapedText: DocEscapedText = docNode as DocEscapedText;
        this.writeContent(docEscapedText.encodedText);
        break;

      case DocNodeKind.FencedCode:
        const docFencedCode: DocFencedCode = docNode as DocFencedCode;

        this.ensureAtStartOfLine();

        this.writeContent('```');
        this.writeContent(docFencedCode.language);
        this.writeNewline();
        this.writeContent(docFencedCode.code);
        this.writeContent('```');
        this.writeNewline();
        break;

      case DocNodeKind.HtmlAttribute:
        const docHtmlAttribute: DocHtmlAttribute = docNode as DocHtmlAttribute;
        this.writeContent(docHtmlAttribute.name);
        this.writeContent(docHtmlAttribute.spacingAfterName);
        this.writeContent('=');
        this.writeContent(docHtmlAttribute.spacingAfterEquals);
        this.writeContent(docHtmlAttribute.value);
        this.writeContent(docHtmlAttribute.spacingAfterValue);
        break;

      case DocNodeKind.HtmlEndTag:
        const docHtmlEndTag: DocHtmlEndTag = docNode as DocHtmlEndTag;
        this.writeContent('</');
        this.writeContent(docHtmlEndTag.name);
        this.writeContent('>');
        break;

      case DocNodeKind.HtmlStartTag:
        const docHtmlStartTag: DocHtmlStartTag = docNode as DocHtmlStartTag;
        this.writeContent('<');
        this.writeContent(docHtmlStartTag.name);
        this.writeContent(docHtmlStartTag.spacingAfterName);

        let needsSpace: boolean =
          docHtmlStartTag.spacingAfterName === undefined ||
          docHtmlStartTag.spacingAfterName.length === 0;

        for (const attribute of docHtmlStartTag.htmlAttributes) {
          if (needsSpace) {
            this.writeContent(' ');
          }
          this.renderNode(attribute);
          needsSpace =
            attribute.spacingAfterValue === undefined || attribute.spacingAfterValue.length === 0;
        }
        this.writeContent(docHtmlStartTag.selfClosingTag ? '/>' : '>');
        break;

      case DocNodeKind.InheritDocTag:
        const docInheritDocTag: DocInheritDocTag = docNode as DocInheritDocTag;
        this.renderInlineTag(docInheritDocTag, () => {
          if (docInheritDocTag.declarationReference) {
            this.writeContent(' ');
            this.renderNode(docInheritDocTag.declarationReference);
          }
        });
        break;

      case DocNodeKind.InlineTag:
        const docInlineTag: DocInlineTag = docNode as DocInlineTag;
        this.renderInlineTag(docInlineTag, () => {
          if (docInlineTag.tagContent.length > 0) {
            this.writeContent(' ');
            this.writeContent(docInlineTag.tagContent);
          }
        });
        break;

      case DocNodeKind.LinkTag:
        const docLinkTag: DocLinkTag = docNode as DocLinkTag;
        this.renderInlineTag(docLinkTag, () => {
          if (docLinkTag.urlDestination !== undefined || docLinkTag.codeDestination !== undefined) {
            if (docLinkTag.urlDestination !== undefined) {
              this.writeContent(' ');
              this.writeContent(docLinkTag.urlDestination);
            } else if (docLinkTag.codeDestination !== undefined) {
              this.writeContent(' ');
              this.renderNode(docLinkTag.codeDestination);
            }
          }
          if (docLinkTag.linkText !== undefined) {
            this.writeContent(' ');
            this.writeContent('|');
            this.writeContent(' ');
            this.writeContent(docLinkTag.linkText);
          }
        });
        break;

      case DocNodeKind.MemberIdentifier:
        const docMemberIdentifier: DocMemberIdentifier = docNode as DocMemberIdentifier;
        if (docMemberIdentifier.hasQuotes) {
          this.writeContent('"');
          this.writeContent(docMemberIdentifier.identifier); // todo: encoding
          this.writeContent('"');
        } else {
          this.writeContent(docMemberIdentifier.identifier);
        }
        break;

      case DocNodeKind.MemberReference:
        const docMemberReference: DocMemberReference = docNode as DocMemberReference;
        if (docMemberReference.hasDot) {
          this.writeContent('.');
        }

        if (docMemberReference.selector) {
          this.writeContent('(');
        }

        if (docMemberReference.memberSymbol) {
          this.renderNode(docMemberReference.memberSymbol);
        } else {
          this.renderNode(docMemberReference.memberIdentifier);
        }

        if (docMemberReference.selector) {
          this.writeContent(':');
          this.renderNode(docMemberReference.selector);
          this.writeContent(')');
        }
        break;

      case DocNodeKind.MemberSelector:
        const docMemberSelector: DocMemberSelector = docNode as DocMemberSelector;
        this.writeContent(docMemberSelector.selector);
        break;

      case DocNodeKind.MemberSymbol:
        const docMemberSymbol: DocMemberSymbol = docNode as DocMemberSymbol;
        this.writeContent('[');
        this.renderNode(docMemberSymbol.symbolReference);
        this.writeContent(']');
        break;

      case DocNodeKind.Section:
        const docSection: DocSection = docNode as DocSection;
        this.renderNodes(docSection.nodes);
        break;

      case DocNodeKind.Paragraph:
        // revert once upstream is fixed
        const trimmedParagraph: DocParagraph = TrimSpacesTransform.transform(
          docNode as DocParagraph
        );
        if (trimmedParagraph.nodes.length > 0) {
          if (this._hangingParagraph) {
            // If it's a hanging paragraph, then don't skip a line
            this._hangingParagraph = false;
          } else {
            this.ensureLineSkipped();
          }

          this.renderNodes(trimmedParagraph.nodes);
        }
        break;

      case DocNodeKind.ParamBlock:
        const docParamBlock: DocParamBlock = docNode as DocParamBlock;
        this.ensureLineSkipped();
        this.renderNode(docParamBlock.blockTag);
        this.writeContent(' ');
        this.writeContent(docParamBlock.parameterName);
        this.writeContent(' - ');
        this._hangingParagraph = true;
        this.renderNode(docParamBlock.content);
        this._hangingParagraph = false;
        break;

      case DocNodeKind.ParamCollection:
        const docParamCollection: DocParamCollection = docNode as DocParamCollection;
        this.renderNodes(docParamCollection.blocks);
        break;

      case DocNodeKind.PlainText:
        const docPlainText: DocPlainText = docNode as DocPlainText;
        this.writeContent(docPlainText.text);
        break;

      case DocNodeKind.SoftBreak:
        this.writeNewline();
    }
  }

  private renderInlineTag(
    docInlineTagBase: DocInlineTagBase,
    writeInlineTagContent: () => void
  ): void {
    this.writeContent('{');
    this.writeContent(docInlineTagBase.tagName);
    writeInlineTagContent();
    this.writeContent('}');
  }

  private renderNodes(docNodes: readonly (DocNode | undefined)[]): void {
    for (const docNode of docNodes) {
      this.renderNode(docNode);
    }
  }

  // Calls _writeNewline() only if we're not already at the start of a new line
  private ensureAtStartOfLine(): void {
    if (this._lineState === LineState.MiddleOfLine) {
      this.writeNewline();
    }
  }

  // Calls _writeNewline() if needed to ensure that we have skipped at least one line
  private ensureLineSkipped(): void {
    this.ensureAtStartOfLine();
    if (this._previousLineHadContent) {
      this.writeNewline();
    }
  }

  // Writes literal text content.  If it contains newlines, they will automatically be converted to
  // _writeNewline() calls, to ensure that "*" is written at the start of each line.
  private writeContent(content: string | undefined): void {
    if (content === undefined || content.length === 0) {
      return;
    }

    const splitLines: string[] = content.split(/\r?\n/g);
    if (splitLines.length > 1) {
      let firstLine = true;
      for (const line of splitLines) {
        if (firstLine) {
          firstLine = false;
        } else {
          this.writeNewline();
        }
        this.writeContent(line);
      }
      return;
    }

    if (this._lineState === LineState.Closed) {
      if (this._emitCommentFraming) {
        this._output!.append('/**' + this.eol + ' *');
      }
      this._lineState = LineState.StartOfLine;
    }

    if (this._lineState === LineState.StartOfLine) {
      if (this._emitCommentFraming) {
        this._output!.append(' ');
      }
    }

    this._output!.append(content);
    this._lineState = LineState.MiddleOfLine;
    this._previousLineHadContent = true;
  }

  // Starts a new line, and inserts "/**" or "*" as appropriate.
  private writeNewline(): void {
    if (this._lineState === LineState.Closed) {
      if (this._emitCommentFraming) {
        this._output!.append('/**' + this.eol + ' *');
      }
      this._lineState = LineState.StartOfLine;
    }

    this._previousLineHadContent = this._lineState === LineState.MiddleOfLine;

    if (this._emitCommentFraming) {
      this._output!.append(this.eol + ' *');
    } else {
      this._output!.append(this.eol);
    }

    this._lineState = LineState.StartOfLine;
    this._hangingParagraph = false;
  }

  // Closes the comment, adding the final "*/" delimiter
  private writeEnd(): void {
    if (this._lineState === LineState.MiddleOfLine) {
      if (this._emitCommentFraming) {
        this.writeNewline();
      }
    }

    if (this._lineState !== LineState.Closed) {
      if (this._emitCommentFraming) {
        this._output!.append('/' + this.eol);
      }
      this._lineState = LineState.Closed;
    }
  }
}
