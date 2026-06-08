import { buildVertexUrl, buildMediaPart, buildGenerateContentBody } from './utils';

describe('buildVertexUrl', () => {
  it('builds a regional URL', () => {
    expect(buildVertexUrl({ projectId: 'p1', region: 'us-central1', model: 'gemini-2.5-flash', action: 'generateContent' }))
      .toBe('https://us-central1-aiplatform.googleapis.com/v1/projects/p1/locations/us-central1/publishers/google/models/gemini-2.5-flash:generateContent');
  });
  it('builds a global URL with the non-regional host', () => {
    expect(buildVertexUrl({ projectId: 'p1', region: 'global', model: 'gemini-3-pro', action: 'generateContent' }))
      .toBe('https://aiplatform.googleapis.com/v1/projects/p1/locations/global/publishers/google/models/gemini-3-pro:generateContent');
  });
});

describe('buildMediaPart', () => {
  it('builds inlineData for binary input', () => {
    expect(buildMediaPart({ inputType: 'binary', mimeType: 'image/png', base64: 'AAA' }))
      .toEqual({ inlineData: { mimeType: 'image/png', data: 'AAA' } });
  });
  it('builds fileData for a gcs uri', () => {
    expect(buildMediaPart({ inputType: 'url', mimeType: 'application/pdf', fileUri: 'gs://b/x.pdf' }))
      .toEqual({ fileData: { mimeType: 'application/pdf', fileUri: 'gs://b/x.pdf' } });
  });
  it('throws when binary base64 is missing', () => {
    expect(() => buildMediaPart({ inputType: 'binary', mimeType: 'image/png' })).toThrow('base64');
  });
  it('throws when a gcs uri is missing fileUri', () => {
    expect(() => buildMediaPart({ inputType: 'url', mimeType: 'application/pdf' })).toThrow('fileUri');
  });
});

describe('buildGenerateContentBody', () => {
  it('places media before the prompt in a single user turn', () => {
    const body = buildGenerateContentBody({ prompt: 'describe', mediaPart: { inlineData: { mimeType: 'image/png', data: 'AAA' } } });
    expect(body.contents).toEqual([
      { role: 'user', parts: [{ inlineData: { mimeType: 'image/png', data: 'AAA' } }, { text: 'describe' }] },
    ]);
  });
  it('adds history turns before the final user turn', () => {
    const body = buildGenerateContentBody({ prompt: 'and now?', history: [{ role: 'user', text: 'hi' }, { role: 'model', text: 'hello' }] });
    expect(body.contents).toEqual([
      { role: 'user', parts: [{ text: 'hi' }] },
      { role: 'model', parts: [{ text: 'hello' }] },
      { role: 'user', parts: [{ text: 'and now?' }] },
    ]);
  });
  it('includes systemInstruction and non-empty generationConfig only when provided', () => {
    const body = buildGenerateContentBody({ prompt: 'x', systemInstruction: 'be terse', generationConfig: { temperature: 0.2 } });
    expect(body.systemInstruction).toEqual({ parts: [{ text: 'be terse' }] });
    expect(body.generationConfig).toEqual({ temperature: 0.2 });
    const plain = buildGenerateContentBody({ prompt: 'x', generationConfig: {} });
    expect(plain.systemInstruction).toBeUndefined();
    expect(plain.generationConfig).toBeUndefined();
  });
});
