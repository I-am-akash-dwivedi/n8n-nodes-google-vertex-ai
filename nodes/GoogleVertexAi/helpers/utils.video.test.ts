import { parseModelFromOperationName, extractVideos, formatVideoOutput } from './utils';

const OP = 'projects/p/locations/us-central1/publishers/google/models/veo-3.1-generate-001/operations/abc';

describe('parseModelFromOperationName', () => {
  it('extracts the model id', () => {
    expect(parseModelFromOperationName(OP)).toBe('veo-3.1-generate-001');
  });
  it('returns undefined for an invalid name', () => {
    expect(parseModelFromOperationName('not-an-operation')).toBeUndefined();
  });
});

describe('extractVideos', () => {
  it('collects base64 videos from a completed operation', () => {
    const op = { done: true, response: { videos: [{ mimeType: 'video/mp4', bytesBase64Encoded: 'AAA' }] } };
    expect(extractVideos(op)).toEqual([{ mimeType: 'video/mp4', data: 'AAA' }]);
  });
  it('returns empty when there are no videos', () => {
    expect(extractVideos({ done: true, response: {} })).toEqual([]);
  });
});

describe('formatVideoOutput', () => {
  const makeCtx = () => ({
    helpers: {
      prepareBinaryData: jest.fn(async (buf: Buffer, name: string, mime: string) => ({ data: buf.toString('base64'), fileName: name, mimeType: mime })),
    },
  } as any);

  it('returns the video on the chosen binary field', async () => {
    const ctx = makeCtx();
    const op = { done: true, response: { videos: [{ mimeType: 'video/mp4', bytesBase64Encoded: Buffer.from('vid').toString('base64') }] } };
    const items = await formatVideoOutput.call(ctx, op, 'video');
    expect(items[0].binary?.video).toBeDefined();
  });

  it('returns a json note when no video came back', async () => {
    const ctx = makeCtx();
    const items = await formatVideoOutput.call(ctx, { done: true, response: {} }, 'data');
    expect(items[0].binary).toBeUndefined();
    expect(items[0].json.message).toMatch(/without a video/i);
  });
});
