import { googleVertexAiApiTest } from './credentialTest';

jest.mock('../helpers/utils', () => {
  const actual = jest.requireActual('../helpers/utils');
  return { ...actual, signJwt: jest.fn(() => 'signed.jwt') };
});

describe('googleVertexAiApiTest', () => {
  const makeCtx = (request: jest.Mock) => ({ helpers: { request } } as any);
  const credential = { data: { clientEmail: 'svc@p.iam.gserviceaccount.com', privateKey: 'KEY' } } as any;

  it('returns OK and hits the token endpoint when a token is returned', async () => {
    const request = jest.fn().mockResolvedValue({ access_token: 'tok' });
    const res = await googleVertexAiApiTest.call(makeCtx(request), credential);

    expect(res.status).toBe('OK');
    expect(request.mock.calls[0][0].url).toContain('oauth2.googleapis.com/token');
  });

  it('returns Error when no access token comes back', async () => {
    const request = jest.fn().mockResolvedValue({});
    const res = await googleVertexAiApiTest.call(makeCtx(request), credential);

    expect(res.status).toBe('Error');
  });

  it('returns Error with the message on request failure', async () => {
    const request = jest.fn().mockRejectedValue(new Error('invalid key'));
    const res = await googleVertexAiApiTest.call(makeCtx(request), credential);

    expect(res.status).toBe('Error');
    expect(res.message).toContain('invalid key');
  });
});
