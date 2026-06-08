import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { apiRequest, type ApiRequestOptions } from '../../transport/request';

export const description: INodeProperties[] = [
  {
    displayName: 'Prompt',
    name: 'prompt',
    type: 'string',
    typeOptions: { rows: 4 },
    default: '',
    required: true,
    description: 'Describe the video to generate',
    displayOptions: { show: { resource: ['video'], operation: ['generate'] } },
  },
];

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const prompt = this.getNodeParameter('prompt', i) as string;
  const model = this.getNodeParameter('videoModel', i) as string;
  const options = this.getNodeParameter('videoOptions', i, {}) as IDataObject;

  const parameters: IDataObject = {};
  if (options.aspectRatio) parameters.aspectRatio = options.aspectRatio;
  if (options.durationSeconds) parameters.durationSeconds = String(options.durationSeconds);
  if (options.resolution) parameters.resolution = options.resolution;
  if (options.generateAudio !== undefined) parameters.generateAudio = options.generateAudio;
  if (options.negativePrompt) parameters.negativePrompt = options.negativePrompt;
  if (options.sampleCount) parameters.sampleCount = options.sampleCount;

  // Inline base64 output: no storageUri, so the finished video bytes come back via fetchPredictOperation.
  const body: IDataObject = { instances: [{ prompt }], parameters };
  const operation = await apiRequest.call(this, { model, action: 'predictLongRunning', body } as ApiRequestOptions);

  return [{ json: { operationName: operation.name, done: operation.done === true } }];
}
