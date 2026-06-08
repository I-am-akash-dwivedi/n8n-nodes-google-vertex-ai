import type { IExecuteFunctions } from 'n8n-workflow';
import { createHash } from 'node:crypto';
import { signJwt, formatPrivateKey, TOKEN_URL } from '../helpers/utils';

interface CachedToken { token: string; expiresAt: number }
const tokenCache = new Map<string, CachedToken>();

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

  // eslint-disable-next-line @n8n/community-nodes/no-http-request-with-manual-auth -- This IS the OAuth2 token exchange (JWT bearer grant) that mints the access token; there is no credential auth to attach, so httpRequestWithAuthentication does not apply.
  const res = await this.helpers.httpRequest({
    method: 'POST',
    url: TOKEN_URL,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
  });
  const data = (typeof res === 'string' ? JSON.parse(res) : res) as { access_token: string; expires_in: number };

  tokenCache.set(cacheKey, { token: data.access_token, expiresAt: nowMs + data.expires_in * 1000 });
  return data.access_token;
}
