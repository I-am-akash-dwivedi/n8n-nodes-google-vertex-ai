import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { apiRequest, type ApiRequestOptions } from '../../transport/request';
import { readOptions } from '../../helpers/baseAnalyze';
import { buildGenerateContentBody, formatOutput } from '../../helpers/utils';

export const description: INodeProperties[] = [
  {
    displayName: 'Prompt',
    name: 'prompt',
    type: 'string',
    typeOptions: { rows: 4 },
    default: '',
    required: true,
    description: 'The message to send to the model',
    displayOptions: { show: { resource: ['text'], operation: ['message'] } },
  },
  {
    displayName: 'Messages (History)',
    name: 'messages',
    type: 'fixedCollection',
    typeOptions: { multipleValues: true },
    default: {},
    description: 'Optional prior turns to send before the prompt',
    displayOptions: { show: { resource: ['text'], operation: ['message'] } },
    options: [
      {
        name: 'values',
        displayName: 'Message',
        values: [
          { displayName: 'Role', name: 'role', type: 'options', default: 'user', options: [{ name: 'User', value: 'user' }, { name: 'Model', value: 'model' }] },
          { displayName: 'Text', name: 'text', type: 'string', typeOptions: { rows: 2 }, default: '' },
        ],
      },
    ],
  },
];

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const prompt = this.getNodeParameter('prompt', i) as string;
  const history = (this.getNodeParameter('messages.values', i, []) as Array<{ role: 'user' | 'model'; text: string }>);
  const { systemInstruction, generationConfig, simplify } = readOptions.call(this, i);
  const body = buildGenerateContentBody({ prompt, systemInstruction, generationConfig, history });

  const model = this.getNodeParameter('model', i, '', { extractValue: true }) as string;
  const opts: ApiRequestOptions = { model, action: 'generateContent', body: body as unknown as IDataObject };
  const response = await apiRequest.call(this, opts);
  return formatOutput(response, simplify);
}
