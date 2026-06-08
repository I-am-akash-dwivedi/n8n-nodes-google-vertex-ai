import type {
  ICredentialTestFunctions,
  ICredentialsDecrypted,
  INodeCredentialTestResult,
} from 'n8n-workflow';
import { signJwt, TOKEN_URL } from '../helpers/utils';

/**
 * Credential test for the Google Vertex AI service account. Signs a JWT with the
 * service account key and exchanges it for an access token at Google's OAuth2
 * endpoint — the same flow the node uses at execution time.
 */
export async function googleVertexAiApiTest(
  this: ICredentialTestFunctions,
  credential: ICredentialsDecrypted,
): Promise<INodeCredentialTestResult> {
  const data = (credential.data ?? {}) as { clientEmail?: string; privateKey?: string };
  const clientEmail = data.clientEmail ?? '';
  const privateKey = data.privateKey ?? '';

  try {
    const nowSec = Math.floor(Date.now() / 1000);
    const assertion = signJwt(clientEmail, privateKey, nowSec);

    // The credential-test context (ICredentialTestFunctions) only exposes
    // `helpers.request` — there is no `httpRequest` here — so we bind helpers
    // locally and use the single HTTP helper this context provides.
    const { helpers } = this;
    const res = await helpers.request({
      method: 'POST',
      url: TOKEN_URL,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }).toString(),
    });

    const parsed = (typeof res === 'string' ? JSON.parse(res) : res) as { access_token?: string };
    if (parsed?.access_token) {
      return { status: 'OK', message: 'Successfully authenticated with Google Vertex AI.' };
    }
    return { status: 'Error', message: 'Did not receive an access token.' };
  } catch (error) {
    return { status: 'Error', message: (error as Error).message || String(error) };
  }
}
