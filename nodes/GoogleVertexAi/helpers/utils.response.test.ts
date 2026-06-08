import { extractText, formatOutput, describeApiError } from './utils';

describe('extractText', () => {
  it('joins candidate text parts', () => {
    const resp = { candidates: [{ content: { parts: [{ text: 'Hello ' }, { text: 'world' }] } }] };
    expect(extractText(resp)).toBe('Hello world');
  });
  it('returns empty string when there are no candidates', () => {
    expect(extractText({})).toBe('');
  });
});

describe('formatOutput', () => {
  it('returns only text when simplify is true', () => {
    const resp = { candidates: [{ content: { parts: [{ text: 'hi' }] } }] };
    expect(formatOutput(resp, true)).toEqual([{ json: { text: 'hi' } }]);
  });
  it('returns the raw response when simplify is false', () => {
    const resp = { candidates: [{ content: { parts: [{ text: 'hi' }] } }] };
    expect(formatOutput(resp, false)).toEqual([{ json: resp }]);
  });
});

describe('describeApiError', () => {
  it('maps 403 to an auth hint', () => {
    expect(describeApiError(403)).toMatch(/aiplatform\.user/);
  });
  it('maps 404 to a model/region hint', () => {
    expect(describeApiError(404)).toMatch(/region/i);
  });
  it('maps 429 to a quota hint', () => {
    expect(describeApiError(429)).toMatch(/quota/i);
  });
  it('returns undefined for unmapped statuses', () => {
    expect(describeApiError(200)).toBeUndefined();
  });
  it('maps 401 to the same auth hint as 403', () => {
    expect(describeApiError(401)).toMatch(/aiplatform\.user/);
  });
});
