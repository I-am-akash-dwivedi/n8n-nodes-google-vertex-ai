import type { INodeProperties } from 'n8n-workflow';
export { analyzeExecute as execute } from '../../helpers/baseAnalyze';

export const description: INodeProperties[] = [
  {
    displayName: 'Prompt',
    name: 'prompt',
    type: 'string',
    typeOptions: { rows: 2 },
    default: 'Generate a complete, accurate transcript of the speech in this audio.',
    required: true,
    description: 'Instruction for the transcription',
    displayOptions: { show: { resource: ['audio'], operation: ['transcribe'] } },
  },
];
