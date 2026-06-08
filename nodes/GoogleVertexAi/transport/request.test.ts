import { mockExecute } from '../test/helpers';

jest.mock('./auth', () => ({ getAccessToken: jest.fn(async () => 'tok-xyz') }));

describe('apiRequest', () => {
  it('reads project/region from the credential and calls the correct URL with a bearer token', async () => {
    const { apiRequest } = await import('./request');
    const ctx = mockExecute();
    ctx.getCredentials.mockResolvedValue({ projectId: 'p1', region: 'us-central1' });
    ctx.helpers.httpRequest.mockResolvedValue({ ok: true });

    const result = await apiRequest.call(ctx, {
      model: 'gemini-2.5-flash', action: 'generateContent', body: { contents: [] },
    });

    expect(result).toEqual({ ok: true });
    const call = ctx.helpers.httpRequest.mock.calls[0][0];
    expect(call.url).toContain('us-central1-aiplatform.googleapis.com');
    expect(call.url).toContain('/projects/p1/locations/us-central1/');
    expect(call.headers.Authorization).toBe('Bearer tok-xyz');
  });

  it('throws a NodeApiError with a friendly hint on 403', async () => {
    const { apiRequest } = await import('./request');
    const ctx = mockExecute();
    ctx.getCredentials.mockResolvedValue({ projectId: 'p1', region: 'us-central1' });
    const err: any = new Error('forbidden'); err.httpCode = '403';
    ctx.helpers.httpRequest.mockRejectedValue(err);

    await expect(apiRequest.call(ctx, {
      model: 'm', action: 'generateContent', body: {},
    })).rejects.toThrow(/aiplatform\.user/);
  });
});
