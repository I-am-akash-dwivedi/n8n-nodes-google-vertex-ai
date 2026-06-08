import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest, type ApiRequestOptions } from '../transport/request';
import { buildGenerateContentBody, buildMediaPart, formatOutput, type MediaPart } from './utils';

export interface ResolvedOptions {
  systemInstruction?: string;
  generationConfig?: IDataObject;
  simplify: boolean;
}

export function readOptions(this: IExecuteFunctions, i: number): ResolvedOptions {
  const options = this.getNodeParameter('options', i, {}) as IDataObject;
  const generationConfig: IDataObject = {};
  for (const key of ['temperature', 'maxOutputTokens', 'topP', 'topK'] as const) {
    if (options[key] !== undefined && options[key] !== '') generationConfig[key] = options[key];
  }
  if (options.jsonOutput === true) generationConfig.responseMimeType = 'application/json';
  return {
    systemInstruction: (options.systemInstruction as string) || undefined,
    generationConfig: Object.keys(generationConfig).length ? generationConfig : undefined,
    simplify: options.simplify !== false,
  };
}

/** Reads one binary property into a Gemini media part (MIME auto-detected unless overridden). */
export async function readBinaryMediaPart(
  this: IExecuteFunctions,
  i: number,
  propertyName: string,
  mimeTypeOverride?: string,
): Promise<MediaPart> {
  const binaryData = this.helpers.assertBinaryData(i, propertyName);
  const buffer = await this.helpers.getBinaryDataBuffer(i, propertyName);
  const mimeType = mimeTypeOverride || binaryData.mimeType;
  return buildMediaPart({ inputType: 'binary', mimeType, base64: buffer.toString('base64') });
}

/** Reads the multi-image input (the "Images" fixedCollection) into Gemini media parts. */
export async function readImageInputs(this: IExecuteFunctions, i: number): Promise<MediaPart[]> {
  const entries = this.getNodeParameter('images.image', i, []) as Array<{ binaryField?: string }>;
  const properties = entries.map((entry) => (entry.binaryField ?? '').trim()).filter(Boolean);
  if (properties.length === 0) {
    throw new NodeOperationError(this.getNode(), 'At least one input image is required', { itemIndex: i });
  }
  const parts: MediaPart[] = [];
  for (const property of properties) {
    parts.push(await readBinaryMediaPart.call(this, i, property));
  }
  return parts;
}

/** Reads a media file input (binary upload or GCS URI) into a Gemini media part. */
export async function readMediaInput(this: IExecuteFunctions, i: number): Promise<MediaPart> {
  const inputType = this.getNodeParameter('inputType', i) as 'binary' | 'url';
  const mimeType = this.getNodeParameter('mimeType', i, '') as string;

  if (inputType === 'binary') {
    const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
    return readBinaryMediaPart.call(this, i, binaryPropertyName, mimeType || undefined);
  }

  const fileUri = this.getNodeParameter('fileUri', i) as string;
  if (!mimeType) throw new NodeOperationError(this.getNode(), 'MIME Type is required when using a GCS URI');
  return buildMediaPart({ inputType: 'url', mimeType, fileUri });
}

export async function analyzeExecute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const prompt = this.getNodeParameter('prompt', i) as string;
  const mediaPart = await readMediaInput.call(this, i);

  const { systemInstruction, generationConfig, simplify } = readOptions.call(this, i);
  const body = buildGenerateContentBody({ prompt, mediaPart, systemInstruction, generationConfig });

  const model = this.getNodeParameter('model', i, '', { extractValue: true }) as string;
  const opts: ApiRequestOptions = { model, action: 'generateContent', body: body as unknown as IDataObject };
  const response = await apiRequest.call(this, opts);
  return formatOutput(response, simplify);
}
