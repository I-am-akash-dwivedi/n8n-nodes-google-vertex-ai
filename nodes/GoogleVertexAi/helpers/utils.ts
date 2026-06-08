import * as crypto from 'node:crypto';
import type { IBinaryKeyData, IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

export const VERTEX_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';
export const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export interface JwtClaims {
  iss: string;
  scope: string;
  aud: string;
  iat: number;
  exp: number;
}

export function base64url(input: string | Buffer): string {
  const base64 = Buffer.isBuffer(input) ? input.toString('base64') : Buffer.from(input).toString('base64');
  return base64
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function signJwt(clientEmail: string, privateKey: string, nowSeconds: number): string {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = buildJwtClaims(clientEmail, nowSeconds);

  const unsignedToken = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const formattedKey = formatPrivateKey(privateKey);
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsignedToken);
  sign.end();
  
  const signature = sign.sign(formattedKey);
  return `${unsignedToken}.${base64url(signature)}`;
}

export function formatPrivateKey(key: string): string {
  return key.replace(/\\n/g, '\n').trim();
}

export function buildJwtClaims(email: string, nowSeconds: number): JwtClaims {
  return {
    iss: email,
    scope: VERTEX_SCOPE,
    aud: TOKEN_URL,
    iat: nowSeconds,
    exp: nowSeconds + 3600,
  };
}

export interface InlineDataPart { inlineData: { mimeType: string; data: string } }
export interface FileDataPart { fileData: { mimeType: string; fileUri: string } }
export type MediaPart = InlineDataPart | FileDataPart;
export type Part = MediaPart | { text: string };

export interface GenerateContentBody {
  contents: Array<{ role: 'user' | 'model'; parts: Part[] }>;
  systemInstruction?: { parts: Array<{ text: string }> };
  generationConfig?: Record<string, unknown>;
}

export function buildVertexUrl(opts: { projectId: string; region: string; model: string; action: string }): string {
  const host = opts.region === 'global'
    ? 'https://aiplatform.googleapis.com'
    : `https://${opts.region}-aiplatform.googleapis.com`;
  return `${host}/v1/projects/${opts.projectId}/locations/${opts.region}/publishers/google/models/${opts.model}:${opts.action}`;
}

export function buildMediaPart(opts: {
  inputType: 'binary' | 'url';
  mimeType: string;
  base64?: string;
  fileUri?: string;
}): MediaPart {
  if (opts.inputType === 'binary') {
    if (!opts.base64) throw new Error('Binary input requires base64 data');
    return { inlineData: { mimeType: opts.mimeType, data: opts.base64 } };
  }
  if (!opts.fileUri) throw new Error('GCS input requires a fileUri');
  return { fileData: { mimeType: opts.mimeType, fileUri: opts.fileUri } };
}

export function buildGenerateContentBody(opts: {
  prompt: string;
  mediaPart?: MediaPart;
  mediaParts?: MediaPart[];
  systemInstruction?: string;
  generationConfig?: Record<string, unknown>;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
}): GenerateContentBody {
  const contents: GenerateContentBody['contents'] = [];
  for (const turn of Array.isArray(opts.history) ? opts.history : []) {
    contents.push({ role: turn.role, parts: [{ text: turn.text }] });
  }
  const userParts: Part[] = [];
  const mediaParts = opts.mediaParts ?? (opts.mediaPart ? [opts.mediaPart] : []);
  for (const part of mediaParts) userParts.push(part);
  userParts.push({ text: opts.prompt });
  contents.push({ role: 'user', parts: userParts });

  const body: GenerateContentBody = { contents };
  if (opts.systemInstruction) body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };
  if (opts.generationConfig && Object.keys(opts.generationConfig).length > 0) {
    body.generationConfig = opts.generationConfig;
  }
  return body;
}

export interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
  promptFeedback?: { blockReason?: string };
}

export function extractText(response: GeminiResponse): string {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p) => p.text ?? '').join('');
}

export function formatOutput(response: IDataObject, simplify: boolean): INodeExecutionData[] {
  if (simplify) return [{ json: { text: extractText(response as GeminiResponse) } }];
  return [{ json: response }];
}

/**
 * Builds the generationConfig for a Gemini image ("Nano Banana") request:
 * always asks for an image modality, and adds imageConfig when provided.
 */
export function buildImageGenerationConfig(opts: { aspectRatio?: string; imageSize?: string }): Record<string, unknown> {
  const config: Record<string, unknown> = { responseModalities: ['TEXT', 'IMAGE'] };
  const imageConfig: Record<string, unknown> = {};
  if (opts.aspectRatio) imageConfig.aspectRatio = opts.aspectRatio;
  if (opts.imageSize) imageConfig.imageSize = opts.imageSize;
  if (Object.keys(imageConfig).length > 0) config.imageConfig = imageConfig;
  return config;
}

export interface ImagePart { mimeType: string; data: string }

/**
 * Collects inline image parts from a generateContent response, de-duplicating
 * byte-identical images (these models often return the same image more than once).
 */
export function extractImages(response: IDataObject): ImagePart[] {
  const candidates = (response.candidates ?? []) as Array<{
    content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> };
  }>;
  const images: ImagePart[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    for (const part of candidate.content?.parts ?? []) {
      const inline = part.inlineData;
      if (inline?.data && !seen.has(inline.data)) {
        seen.add(inline.data);
        images.push({ mimeType: inline.mimeType ?? 'image/png', data: inline.data });
      }
    }
  }
  return images;
}

/**
 * Turns a Gemini image response into n8n items: one item per returned image with
 * the bytes on the `data` binary property. If no image came back (e.g. a safety
 * filter), returns a single json item with any model text / block reason so the
 * failure is visible rather than silently empty.
 */
export async function formatImageOutput(
  this: IExecuteFunctions,
  response: IDataObject,
  outputField = 'data',
): Promise<INodeExecutionData[]> {
  const images = extractImages(response);
  const text = extractText(response as GeminiResponse);

  if (images.length === 0) {
    const blockReason = (response.promptFeedback as { blockReason?: string } | undefined)?.blockReason;
    return [{ json: { text, ...(blockReason ? { blockReason } : {}) } }];
  }

  const binary: IBinaryKeyData = {};
  for (let idx = 0; idx < images.length; idx++) {
    const image = images[idx];
    const buffer = Buffer.from(image.data, 'base64');
    const extension = image.mimeType.split('/')[1] ?? 'png';
    // First image on the chosen field; any extras get a numeric suffix.
    const key = idx === 0 ? outputField : `${outputField}${idx}`;
    binary[key] = await this.helpers.prepareBinaryData(buffer, `${key}.${extension}`, image.mimeType);
  }
  return [{ json: text ? { text } : {}, binary }];
}

/** Extracts the Veo model id from a long-running operation name, or undefined if it doesn't match. */
export function parseModelFromOperationName(operationName: string): string | undefined {
  return operationName.match(/\/models\/([^/]+)\/operations\//)?.[1];
}

export interface VideoPart { mimeType: string; data: string }

/** Collects inline video parts from a completed predictLongRunning operation. */
export function extractVideos(operation: IDataObject): VideoPart[] {
  const response = (operation.response ?? {}) as { videos?: Array<{ mimeType?: string; bytesBase64Encoded?: string }> };
  const videos: VideoPart[] = [];
  for (const video of response.videos ?? []) {
    if (video.bytesBase64Encoded) videos.push({ mimeType: video.mimeType ?? 'video/mp4', data: video.bytesBase64Encoded });
  }
  return videos;
}

/**
 * Turns a completed Veo operation into n8n items: one binary video per result on
 * the chosen field (extras get a numeric suffix). If the operation finished with
 * no video (e.g. safety-filtered), returns a json note instead.
 */
export async function formatVideoOutput(
  this: IExecuteFunctions,
  operation: IDataObject,
  outputField = 'data',
): Promise<INodeExecutionData[]> {
  const videos = extractVideos(operation);
  if (videos.length === 0) {
    return [{ json: { message: 'The operation finished without a video (it may have been filtered).', response: operation.response ?? {} } }];
  }

  const binary: IBinaryKeyData = {};
  for (let idx = 0; idx < videos.length; idx++) {
    const video = videos[idx];
    const buffer = Buffer.from(video.data, 'base64');
    const extension = video.mimeType.split('/')[1] ?? 'mp4';
    const key = idx === 0 ? outputField : `${outputField}${idx}`;
    binary[key] = await this.helpers.prepareBinaryData(buffer, `${key}.${extension}`, video.mimeType);
  }
  return [{ json: {}, binary }];
}

export function describeApiError(statusCode?: number): string | undefined {
  switch (statusCode) {
    case 401:
    case 403:
      return 'Authentication failed. Check the service-account key, that the Vertex AI API is enabled for the project, and that the account has the "Vertex AI User" (roles/aiplatform.user) role.';
    case 404:
      return 'Model or resource not found. The model may not be available in this region — try the "global" region or a different model.';
    case 429:
      return 'Quota or rate limit exceeded for this project/region.';
    default:
      return undefined;
  }
}
