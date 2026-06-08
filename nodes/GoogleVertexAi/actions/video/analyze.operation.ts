import type { INodeProperties } from 'n8n-workflow';
export { analyzeExecute as execute } from '../../helpers/baseAnalyze';

export const description: INodeProperties[] = [
  {
    displayName: 'Prompt',
    name: 'prompt',
    type: 'string',
    typeOptions: { rows: 3 },
    default: '',
    required: true,
    description: 'What to ask about the video',
    displayOptions: { show: { resource: ['video'], operation: ['analyze'] } },
  },
];
