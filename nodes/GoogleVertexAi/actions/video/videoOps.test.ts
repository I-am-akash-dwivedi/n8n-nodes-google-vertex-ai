import { mockExecute } from '../../test/helpers';

jest.mock('../../transport/request', () => ({ apiRequest: jest.fn() }));

const OP = 'projects/p/locations/us-central1/publishers/google/models/veo-3.1-generate-001/operations/abc';

describe('video generate operation', () => {
  it('starts a predictLongRunning job and returns the operation name', async () => {
    const { apiRequest } = await import('../../transport/request');
    (apiRequest as jest.Mock).mockReset().mockResolvedValue({ name: OP, done: false });
    const { execute } = await import('./generate.operation');
    const ctx = mockExecute();
    ctx.getNodeParameter.mockImplementation((name: string, _i?: number, fb?: unknown) => {
      if (name === 'prompt') return 'a dog surfing';
      if (name === 'videoModel') return 'veo-3.1-generate-001';
      if (name === 'videoOptions') return { aspectRatio: '16:9', durationSeconds: '8', generateAudio: true };
      return fb;
    });

    const items = await execute.call(ctx, 0);

    const opts = (apiRequest as jest.Mock).mock.calls[0][0];
    expect(opts.model).toBe('veo-3.1-generate-001');
    expect(opts.action).toBe('predictLongRunning');
    expect(opts.body.instances[0].prompt).toBe('a dog surfing');
    expect(opts.body.parameters).toMatchObject({ aspectRatio: '16:9', durationSeconds: '8', generateAudio: true });
    expect(items[0].json.operationName).toBe(OP);
  });
});

describe('video status operation', () => {
  it('parses the model from the operation name and reports done + count', async () => {
    const { apiRequest } = await import('../../transport/request');
    (apiRequest as jest.Mock).mockReset().mockResolvedValue({
      name: OP, done: true, response: { videos: [{ bytesBase64Encoded: 'AAA', mimeType: 'video/mp4' }] },
    });
    const { execute } = await import('./status.operation');
    const ctx = mockExecute();
    ctx.getNodeParameter.mockImplementation((name: string) => (name === 'operationName' ? OP : undefined));

    const items = await execute.call(ctx, 0);

    const opts = (apiRequest as jest.Mock).mock.calls[0][0];
    expect(opts.model).toBe('veo-3.1-generate-001');
    expect(opts.action).toBe('fetchPredictOperation');
    expect(items[0].json.done).toBe(true);
    expect(items[0].json.videoCount).toBe(1);
  });
});

describe('video download operation', () => {
  it('throws a clear error if the operation is not done', async () => {
    const { apiRequest } = await import('../../transport/request');
    (apiRequest as jest.Mock).mockReset().mockResolvedValue({ name: OP, done: false });
    const { execute } = await import('./download.operation');
    const ctx = mockExecute();
    ctx.getNodeParameter.mockImplementation((name: string, _i?: number, fb?: unknown) =>
      name === 'operationName' ? OP : name === 'videoOutputField' ? 'data' : fb,
    );

    await expect(execute.call(ctx, 0)).rejects.toThrow(/not ready/i);
  });

  it('returns the video as binary when done', async () => {
    const { apiRequest } = await import('../../transport/request');
    (apiRequest as jest.Mock).mockReset().mockResolvedValue({
      name: OP, done: true, response: { videos: [{ bytesBase64Encoded: Buffer.from('v').toString('base64'), mimeType: 'video/mp4' }] },
    });
    const { execute } = await import('./download.operation');
    const ctx = mockExecute();
    ctx.getNodeParameter.mockImplementation((name: string, _i?: number, fb?: unknown) =>
      name === 'operationName' ? OP : name === 'videoOutputField' ? 'data' : fb,
    );

    const items = await execute.call(ctx, 0);
    expect(items[0].binary?.data).toBeDefined();
  });
});
