import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { buildVertexUrl, describeApiError } from '../helpers/utils';
import { getAccessToken } from './auth';

export interface ApiRequestOptions {
  model: string;
  action: string;
  body: IDataObject;
}

/** Reads the GCP project ID and region from the credential. */
export async function getProjectConfig(this: IExecuteFunctions): Promise<{ projectId: string; region: string }> {
  const creds = await this.getCredentials('googleVertexAiApi');
  return { projectId: creds.projectId as string, region: creds.region as string };
}

export async function apiRequest(this: IExecuteFunctions, opts: ApiRequestOptions): Promise<IDataObject> {
  try {
    const { projectId, region } = await getProjectConfig.call(this);
    const token = await getAccessToken.call(this);
    const url = buildVertexUrl({ projectId, region, model: opts.model, action: opts.action });
    return (await this.helpers.httpRequest({
      method: 'POST',
      url,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: opts.body,
      json: true,
    })) as IDataObject;
  } catch (error) {
    const e = error as { httpCode?: string | number; statusCode?: number; response?: { status?: number } };
    const status = Number(e.httpCode ?? e.statusCode ?? e.response?.status);
    const hint = describeApiError(status);
    throw new NodeApiError(this.getNode(), error as never, hint ? { message: hint, description: (error as Error).message } : undefined);
  }
}
