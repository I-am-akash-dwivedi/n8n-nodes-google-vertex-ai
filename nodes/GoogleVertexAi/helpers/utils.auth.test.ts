import { formatPrivateKey, buildJwtClaims, VERTEX_SCOPE, TOKEN_URL } from './utils';

describe('formatPrivateKey', () => {
  it('converts escaped newlines to real newlines and trims', () => {
    const input = '  -----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----\\n  ';
    expect(formatPrivateKey(input)).toBe('-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----');
  });
  it('leaves real newlines intact', () => {
    const input = '-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----';
    expect(formatPrivateKey(input)).toBe(input);
  });
});

describe('buildJwtClaims', () => {
  it('builds claims with a one-hour expiry and the vertex scope', () => {
    const claims = buildJwtClaims('svc@proj.iam.gserviceaccount.com', 1000);
    expect(claims).toEqual({
      iss: 'svc@proj.iam.gserviceaccount.com',
      scope: VERTEX_SCOPE,
      aud: TOKEN_URL,
      iat: 1000,
      exp: 4600,
    });
  });
});
