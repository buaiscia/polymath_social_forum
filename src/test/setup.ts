import '@testing-library/jest-dom';

type SelectionDirection = 'none' | 'forward' | 'backward';

class TestRange {
  setStart() {}
  setEnd() {}
  commonAncestorContainer = document.createElement('div');
  getBoundingClientRect() {
    return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 } as DOMRect;
  }
  getClientRects() {
    return {
      length: 0,
      item: () => null,
      [Symbol.iterator]: function* () {},
    } as DOMRectList;
  }
  cloneContents() {
    return document.createDocumentFragment();
  }
  selectNodeContents() {}
  collapse() {}
  insertNode() {}
  surroundContents() {}
}

class TestSelection implements Selection {
  private _anchorNode: Node | null = null;
  private _anchorOffset = 0;
  private _focusNode: Node | null = null;
  private _focusOffset = 0;
  private _isCollapsed = true;
  private _rangeCount = 0;
  private _type = 'None';
  private _direction: SelectionDirection = 'none';

  private updateType() {
    this._type = this._rangeCount > 0 ? 'Range' : 'Caret';
  }

  get anchorNode() {
    return this._anchorNode;
  }

  get anchorOffset() {
    return this._anchorOffset;
  }

  get focusNode() {
    return this._focusNode;
  }

  get focusOffset() {
    return this._focusOffset;
  }

  get isCollapsed() {
    return this._isCollapsed;
  }

  get rangeCount() {
    return this._rangeCount;
  }

  get type() {
    return this._type;
  }

  get direction() {
    return this._direction;
  }

  getRangeAt(): Range {
    return document.createRange();
  }

  addRange(): void {
    this._rangeCount = 1;
    this._isCollapsed = false;
    this._direction = 'none';
    this.updateType();
  }

  removeRange(): void {
    this._rangeCount = Math.max(0, this._rangeCount - 1);
    this._isCollapsed = this._rangeCount === 0;
    this._direction = 'none';
    this.updateType();
  }

  removeAllRanges(): void {
    this._rangeCount = 0;
    this._isCollapsed = true;
    this._direction = 'none';
    this.updateType();
  }

  collapse(node: Node | null, offset = 0): void {
    this._anchorNode = node;
    this._focusNode = node;
    this._anchorOffset = offset;
    this._focusOffset = offset;
    this._isCollapsed = true;
    this._rangeCount = 0;
    this._direction = 'none';
    this.updateType();
  }

  collapseToStart(): void {}

  collapseToEnd(): void {}

  selectAllChildren(): void {}

  deleteFromDocument(): void {}

  containsNode(): boolean {
    return false;
  }

  setBaseAndExtent(
    anchorNode: Node | null,
    anchorOffset: number,
    focusNode: Node | null,
    focusOffset: number,
  ): void {
    this._anchorNode = anchorNode;
    this._anchorOffset = anchorOffset;
    this._focusNode = focusNode;
    this._focusOffset = focusOffset;
    this._isCollapsed = anchorNode === focusNode && anchorOffset === focusOffset;
    this._direction = 'none';
  }

  setPosition(node: Node | null, offset = 0): void {
    this.collapse(node, offset);
  }

  extend(): void {}

  modify(): void {}

  empty(): void {
    this.removeAllRanges();
  }

  getComposedRange(): Range {
    return this.getRangeAt();
  }

  getComposedRanges(): Range[] {
    return this.rangeCount > 0 ? [this.getRangeAt()] : [];
  }

  toString(): string {
    return '';
  }
}

if (!(globalThis as { Range?: typeof Range }).Range) {
  (globalThis as { Range?: typeof Range }).Range = TestRange as unknown as typeof Range;
}

if (!document.createRange) {
  document.createRange = () => new TestRange() as unknown as Range;
}

if (typeof window !== 'undefined' && !window.getSelection) {
  window.getSelection = () => new TestSelection();
}
