import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { apiRequest, type ApiRequestOptions } from '../../transport/request';
import { readImageInputs } from '../../helpers/baseAnalyze';
import { buildGenerateContentBody, buildImageGenerationConfig, formatImageOutput } from '../../helpers/utils';

export const description: INodeProperties[] = [
  {
    displayName: 'Prompt',
    name: 'prompt',
    type: 'string',
    typeOptions: { rows: 4 },
    default: '',
    required: true,
    description: 'Describe the change to make to the image (e.g. "add a red hat", "make it night-time")',
    displayOptions: { show: { resource: ['image'], operation: ['edit'] } },
  },
];

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const prompt = this.getNodeParameter('prompt', i) as string;
  const mediaParts = await readImageInputs.call(this, i);

  const model = this.getNodeParameter('imageModel', i) as string;
  const imageOptions = this.getNodeParameter('imageOptions', i, {}) as IDataObject;
  const outputField = (imageOptions.outputBinaryField as string) || 'edited';
  const generationConfig = buildImageGenerationConfig({
    aspectRatio: imageOptions.aspectRatio as string,
    imageSize: imageOptions.imageSize as string,
  });
  const body = buildGenerateContentBody({ prompt, mediaParts, generationConfig });

  const opts: ApiRequestOptions = { model, action: 'generateContent', body: body as unknown as IDataObject };
  const response = await apiRequest.call(this, opts);
  return formatImageOutput.call(this, response, outputField);
}
