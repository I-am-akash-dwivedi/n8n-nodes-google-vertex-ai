import { mockExecute } from '../test/helpers';

jest.mock('../transport/request', () => ({ apiRequest: jest.fn(async () => ({ candidates: [{ content: { parts: [{ text: 'a cat' }] } }] })) }));
import { apiRequest } from '../transport/request';
import { readOptions, analyzeExecute } from './baseAnalyze';

function paramFactory(values: Record<string, unknown>) {
  return (name: string, _i: number, fallback?: unknown) => (name in values ? values[name] : fallback);
}

beforeEach(() => { (apiRequest as jest.Mock).mockClear(); });

describe('readOptions', () => {
  it('collects only provided generationConfig fields and defaults simplify to true', () => {
    const ctx = mockExecute();
    ctx.getNodeParameter.mockImplementation(paramFactory({ options: { temperature: 0.1, jsonOutput: true } }));
    const out = readOptions.call(ctx, 0);
    expect(out.generationConfig).toEqual({ temperature: 0.1, responseMimeType: 'application/json' });
    expect(out.simplify).toBe(true);
    expect(out.systemInstruction).toBeUndefined();
  });
});

describe('analyzeExecute (binary path)', () => {
  it('builds an inline media body and returns simplified text', async () => {
    const ctx = mockExecute();
    ctx.getNodeParameter.mockImplementation(paramFactory({
      inputType: 'binary', prompt: 'what is this?', mimeType: '',
      binaryPropertyName: 'data', model: 'gemini-2.5-flash', projectId: 'p1', region: 'us-central1',
      options: {},
    }));
    ctx.helpers.assertBinaryData.mockReturnValue({ mimeType: 'image/png' });
    ctx.helpers.getBinaryDataBuffer.mockResolvedValue(Buffer.from('PNGDATA'));

    const result = await analyzeExecute.call(ctx, 0);

    expect(result).toEqual([{ json: { text: 'a cat' } }]);
    const body = (apiRequest as jest.Mock).mock.calls[0][0].body;
    expect(body.contents[0].parts[0]).toEqual({ inlineData: { mimeType: 'image/png', data: Buffer.from('PNGDATA').toString('base64') } });
    expect(body.contents[0].parts[1]).toEqual({ text: 'what is this?' });
  });
});

describe('analyzeExecute (gcs path)', () => {
  it('builds a fileData body from a gcs uri', async () => {
    const ctx = mockExecute();
    ctx.getNodeParameter.mockImplementation(paramFactory({
      inputType: 'url', prompt: 'summarize', mimeType: 'application/pdf',
      fileUri: 'gs://bucket/doc.pdf', model: 'gemini-2.5-flash', projectId: 'p1', region: 'us-central1',
      options: {},
    }));

    const result = await analyzeExecute.call(ctx, 0);

    expect(result).toEqual([{ json: { text: 'a cat' } }]);
    const body = (apiRequest as jest.Mock).mock.calls[0][0].body;
    expect(body.contents[0].parts[0]).toEqual({ fileData: { mimeType: 'application/pdf', fileUri: 'gs://bucket/doc.pdf' } });
  });

  it('throws when a gcs uri has no MIME type', async () => {
    const ctx = mockExecute();
    ctx.getNodeParameter.mockImplementation(paramFactory({
      inputType: 'url', prompt: 'summarize', mimeType: '',
      fileUri: 'gs://bucket/doc.pdf', model: 'gemini-2.5-flash', projectId: 'p1', region: 'us-central1',
      options: {},
    }));

    await expect(analyzeExecute.call(ctx, 0)).rejects.toThrow(/MIME Type is required/);
  });
});
