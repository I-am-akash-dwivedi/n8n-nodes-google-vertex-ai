import type { IExecuteFunctions } from 'n8n-workflow';
import { createHash } from 'node:crypto';
import { signJwt, formatPrivateKey, TOKEN_URL } from '../helpers/utils';

interface CachedToken { token: string; expiresAt: number }
const tokenCache = new Map<string, CachedToken>();

interface TokenResponse { access_token: string; expires_in: number }

/**
 * Performs the OAuth2 JWT-bearer grant exchange. This is the request that *mints*
 * the access token, so there is no n8n credential auth to attach to it — which is
 * why it uses `httpRequest` rather than `httpRequestWithAuthentication`. It is kept
 * in its own function (free of `getCredentials`) so token minting and credential
 * retrieval stay as separate concerns.
 */
async function exchangeJwtForToken(this: IExecuteFunctions, assertion: string): Promise<TokenResponse> {
  const res = await this.helpers.httpRequest({
    method: 'POST',
    url: TOKEN_URL,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
  });
  return (typeof res === 'string' ? JSON.parse(res) : res) as TokenResponse;
}

export async function getAccessToken(this: IExecuteFunctions): Promise<string> {
  const creds = await this.getCredentials('googleVertexAiApi');
  const email = creds.clientEmail as string;
  const privateKey = formatPrivateKey(creds.privateKey as string);
  const cacheKey = `${email}:${createHash('sha256').update(privateKey).digest('hex').slice(0, 16)}`;

  const nowMs = Date.now();
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > nowMs + 60_000) return cached.token;

  const nowSec = Math.floor(nowMs / 1000);
  const assertion = signJwt(email, privateKey, nowSec);
  const data = await exchangeJwtForToken.call(this, assertion);

  tokenCache.set(cacheKey, { token: data.access_token, expiresAt: nowMs + data.expires_in * 1000 });
  return data.access_token;
}
