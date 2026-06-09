import { GoogleVertexAiApi } from '../../credentials/GoogleVertexAiApi.credentials';

jest.mock('./helpers/utils', () => {
  const actual = jest.requireActual('./helpers/utils');
  return { ...actual, signJwt: jest.fn(() => 'signed.jwt') };
});

describe('GoogleVertexAiApi credential', () => {
  const cred = new GoogleVertexAiApi();

  it('declares a declarative credential test against Vertex AI', () => {
    expect(cred.test.request.method).toBe('POST');
    expect(cred.test.request.url).toContain(':countTokens');
    expect(cred.test.request.baseURL).toContain('aiplatform.googleapis.com');
  });

  it('injects the minted access token as a Bearer header', () => {
    const headers = (cred.authenticate.properties as { headers: Record<string, string> }).headers;
    expect(headers.Authorization).toBe('=Bearer {{$credentials.accessToken}}');
  });

  it('preAuthentication signs a JWT and exchanges it for an access token', async () => {
    const httpRequest = jest.fn().mockResolvedValue({ access_token: 'tok-123', expires_in: 3600 });
    const ctx = { helpers: { httpRequest } } as never;
    const out = await cred.preAuthentication.call(ctx, {
      clientEmail: 'svc@p.iam.gserviceaccount.com',
      privateKey: 'KEY',
    });

    expect(out).toEqual({ accessToken: 'tok-123' });
    expect(httpRequest.mock.calls[0][0].url).toContain('oauth2.googleapis.com/token');
    expect(httpRequest.mock.calls[0][0].body).toContain('grant_type=urn');
  });
});
