import { buildImageGenerationConfig, extractImages, formatImageOutput } from './utils';

describe('buildImageGenerationConfig', () => {
  it('always requests an image modality and includes imageConfig when set', () => {
    const cfg = buildImageGenerationConfig({ aspectRatio: '16:9', imageSize: '2K' });
    expect(cfg.responseModalities).toEqual(['TEXT', 'IMAGE']);
    expect(cfg.imageConfig).toEqual({ aspectRatio: '16:9', imageSize: '2K' });
  });

  it('omits imageConfig when no options are given', () => {
    const cfg = buildImageGenerationConfig({});
    expect(cfg.responseModalities).toEqual(['TEXT', 'IMAGE']);
    expect(cfg.imageConfig).toBeUndefined();
  });

  it('ignores empty-string options', () => {
    const cfg = buildImageGenerationConfig({ aspectRatio: '', imageSize: '' });
    expect(cfg.imageConfig).toBeUndefined();
  });
});

describe('extractImages', () => {
  it('collects every inline image part', () => {
    const response = {
      candidates: [{ content: { parts: [
        { text: 'here you go' },
        { inlineData: { mimeType: 'image/png', data: 'AAA' } },
        { inlineData: { mimeType: 'image/png', data: 'BBB' } },
      ] } }],
    };
    expect(extractImages(response)).toEqual([
      { mimeType: 'image/png', data: 'AAA' },
      { mimeType: 'image/png', data: 'BBB' },
    ]);
  });

  it('returns empty when there are no inline parts', () => {
    expect(extractImages({ candidates: [{ content: { parts: [{ text: 'no image' }] } }] })).toEqual([]);
  });

  it('de-duplicates byte-identical images', () => {
    const response = {
      candidates: [{ content: { parts: [
        { inlineData: { mimeType: 'image/png', data: 'SAME' } },
        { inlineData: { mimeType: 'image/png', data: 'SAME' } },
      ] } }],
    };
    expect(extractImages(response)).toEqual([{ mimeType: 'image/png', data: 'SAME' }]);
  });
});

describe('formatImageOutput', () => {
  const makeCtx = () => ({
    helpers: {
      prepareBinaryData: jest.fn(async (buf: Buffer, name: string, mime: string) => ({
        data: buf.toString('base64'), fileName: name, mimeType: mime,
      })),
    },
  } as any);

  it('returns a single item with the image on the default "data" field plus any text', async () => {
    const ctx = makeCtx();
    const response = {
      candidates: [{ content: { parts: [
        { text: 'done' },
        { inlineData: { mimeType: 'image/png', data: Buffer.from('hi').toString('base64') } },
      ] } }],
    };
    const items = await formatImageOutput.call(ctx, response);
    expect(items).toHaveLength(1);
    expect(items[0].binary?.data).toBeDefined();
    expect(items[0].json).toEqual({ text: 'done' });
    expect(ctx.helpers.prepareBinaryData).toHaveBeenCalled();
  });

  it('uses the configured output field name', async () => {
    const ctx = makeCtx();
    const response = {
      candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: Buffer.from('x').toString('base64') } }] } }],
    };
    const items = await formatImageOutput.call(ctx, response, 'result');
    expect(items[0].binary?.result).toBeDefined();
    expect(items[0].binary?.data).toBeUndefined();
  });

  it('puts multiple distinct images in one item, suffixing extras', async () => {
    const ctx = makeCtx();
    const response = {
      candidates: [{ content: { parts: [
        { inlineData: { mimeType: 'image/png', data: Buffer.from('a').toString('base64') } },
        { inlineData: { mimeType: 'image/png', data: Buffer.from('b').toString('base64') } },
      ] } }],
    };
    const items = await formatImageOutput.call(ctx, response, 'data');
    expect(items).toHaveLength(1);
    expect(items[0].binary?.data).toBeDefined();
    expect(items[0].binary?.data1).toBeDefined();
  });

  it('surfaces text and blockReason as json when no image is returned', async () => {
    const ctx = makeCtx();
    const response = {
      candidates: [{ content: { parts: [{ text: 'blocked' }] } }],
      promptFeedback: { blockReason: 'SAFETY' },
    };
    const items = await formatImageOutput.call(ctx, response);
    expect(items).toHaveLength(1);
    expect(items[0].binary).toBeUndefined();
    expect(items[0].json).toEqual({ text: 'blocked', blockReason: 'SAFETY' });
  });
});
