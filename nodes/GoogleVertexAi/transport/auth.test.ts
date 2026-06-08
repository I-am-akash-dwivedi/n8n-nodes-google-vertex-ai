import { mockExecute } from '../test/helpers';

jest.mock('../helpers/utils', () => {
  const actual = jest.requireActual('../helpers/utils');
  return {
    ...actual,
    signJwt: jest.fn(() => 'signed.jwt'),
  };
});

describe('getAccessToken', () => {
  const realNow = Date.now;
  afterEach(() => { Date.now = realNow; jest.resetModules(); });

  it('signs a JWT, exchanges it, and caches the token', async () => {
    Date.now = () => 1_000_000;
    const { getAccessToken } = await import('./auth');
    const ctx = mockExecute();
    ctx.getCredentials.mockResolvedValue({ clientEmail: 'svc@p.iam.gserviceaccount.com', privateKey: 'KEY' });
    ctx.helpers.httpRequest.mockResolvedValue({ access_token: 'tok-1', expires_in: 3600 });

    const token1 = await getAccessToken.call(ctx);
    expect(token1).toBe('tok-1');
    expect(ctx.helpers.httpRequest).toHaveBeenCalledTimes(1);

    // Second call within expiry returns the cached token (no new HTTP call).
    const token2 = await getAccessToken.call(ctx);
    expect(token2).toBe('tok-1');
    expect(ctx.helpers.httpRequest).toHaveBeenCalledTimes(1);
  });

  it('refetches a new token after the cached one expires', async () => {
    let now = 1_000_000;
    Date.now = () => now;
    const { getAccessToken } = await import('./auth');
    const ctx = mockExecute();
    ctx.getCredentials.mockResolvedValue({ clientEmail: 'svc@p.iam.gserviceaccount.com', privateKey: 'KEY' });
    ctx.helpers.httpRequest.mockResolvedValue({ access_token: 'tok-1', expires_in: 3600 });

    await getAccessToken.call(ctx);
    expect(ctx.helpers.httpRequest).toHaveBeenCalledTimes(1);

    now = 1_000_000 + 3600 * 1000; // now + 60s > expiresAt → cache miss → refetch
    await getAccessToken.call(ctx);
    expect(ctx.helpers.httpRequest).toHaveBeenCalledTimes(2);
  });
});
