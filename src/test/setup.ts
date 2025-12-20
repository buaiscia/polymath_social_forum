import '@testing-library/jest-dom';

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

if (!(globalThis as { Range?: typeof Range }).Range) {
  (globalThis as { Range?: typeof Range }).Range = TestRange as unknown as typeof Range;
}

if (!document.createRange) {
  document.createRange = () => new TestRange() as unknown as Range;
}

if (typeof window !== 'undefined' && !window.getSelection) {
  window.getSelection = () => ({
    removeAllRanges() {},
    addRange() {},
  }) as Selection;
}
