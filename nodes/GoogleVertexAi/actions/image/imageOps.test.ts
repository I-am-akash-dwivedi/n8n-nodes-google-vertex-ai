import { mockExecute } from '../../test/helpers';

jest.mock('../../transport/request', () => ({
  apiRequest: jest.fn(async () => ({
    candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: Buffer.from('x').toString('base64') } }] } }],
  })),
}));

describe('image generate operation', () => {
  it('builds a generateContent body with image modality + imageConfig and returns binary', async () => {
    const { apiRequest } = await import('../../transport/request');
    (apiRequest as jest.Mock).mockClear();
    const { execute } = await import('./generate.operation');
    const ctx = mockExecute();
    ctx.getNodeParameter.mockImplementation((name: string, _i?: number, fallback?: unknown) => {
      if (name === 'prompt') return 'a cat astronaut';
      if (name === 'imageModel') return 'gemini-2.5-flash-image';
      if (name === 'imageOptions') return { aspectRatio: '16:9', imageSize: '2K' };
      return fallback;
    });

    const items = await execute.call(ctx, 0);

    const opts = (apiRequest as jest.Mock).mock.calls[0][0];
    expect(opts.model).toBe('gemini-2.5-flash-image');
    expect(opts.action).toBe('generateContent');
    expect(opts.body.generationConfig.responseModalities).toEqual(['TEXT', 'IMAGE']);
    expect(opts.body.generationConfig.imageConfig).toEqual({ aspectRatio: '16:9', imageSize: '2K' });
    expect(opts.body.contents[0].parts.some((p: any) => p.text === 'a cat astronaut')).toBe(true);
    // Output defaults to the "edited" field (configurable via Options).
    expect(items[0].binary?.edited).toBeDefined();
  });
});

describe('image edit operation', () => {
  it('sends one inlineData part per image in the collection, plus the prompt', async () => {
    const { apiRequest } = await import('../../transport/request');
    (apiRequest as jest.Mock).mockClear();
    const { execute } = await import('./edit.operation');
    const ctx = mockExecute();
    ctx.getNodeParameter.mockImplementation((name: string, _i?: number, fallback?: unknown) => {
      if (name === 'prompt') return 'add a red hat';
      if (name === 'imageModel') return 'gemini-2.5-flash-image';
      if (name === 'images.image') return [{ binaryField: 'data' }, { binaryField: 'data2' }];
      if (name === 'imageOptions') return { outputBinaryField: 'result' };
      return fallback;
    });
    ctx.helpers.assertBinaryData.mockReturnValue({ mimeType: 'image/png' });
    ctx.helpers.getBinaryDataBuffer.mockResolvedValue(Buffer.from('imgbytes'));

    const items = await execute.call(ctx, 0);

    // Two images in the collection -> two image parts read.
    expect(ctx.helpers.getBinaryDataBuffer).toHaveBeenCalledTimes(2);
    const opts = (apiRequest as jest.Mock).mock.calls[0][0];
    const parts = opts.body.contents[0].parts;
    const imageParts = parts.filter((p: any) => p.inlineData?.mimeType === 'image/png');
    expect(imageParts).toHaveLength(2);
    expect(parts.some((p: any) => p.text === 'add a red hat')).toBe(true);
    // Output goes to the configured field.
    expect(items[0].binary?.result).toBeDefined();
  });
});
