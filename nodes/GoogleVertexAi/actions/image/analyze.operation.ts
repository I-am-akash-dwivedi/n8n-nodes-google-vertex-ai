import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { apiRequest, type ApiRequestOptions } from '../../transport/request';
import { readImageInputs, readOptions } from '../../helpers/baseAnalyze';
import { buildGenerateContentBody, formatOutput } from '../../helpers/utils';

export const description: INodeProperties[] = [
  {
    displayName: 'Prompt',
    name: 'prompt',
    type: 'string',
    typeOptions: { rows: 3 },
    default: '',
    required: true,
    description: 'What to ask about the image(s)',
    displayOptions: { show: { resource: ['image'], operation: ['analyze'] } },
  },
];

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const prompt = this.getNodeParameter('prompt', i) as string;
  const mediaParts = await readImageInputs.call(this, i);

  const { systemInstruction, generationConfig, simplify } = readOptions.call(this, i);
  const body = buildGenerateContentBody({ prompt, mediaParts, systemInstruction, generationConfig });

  const model = this.getNodeParameter('model', i, '', { extractValue: true }) as string;
  const opts: ApiRequestOptions = { model, action: 'generateContent', body: body as unknown as IDataObject };
  const response = await apiRequest.call(this, opts);
  return formatOutput(response, simplify);
}
