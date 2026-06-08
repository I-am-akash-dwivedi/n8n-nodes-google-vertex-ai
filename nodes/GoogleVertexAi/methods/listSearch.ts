import type { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';

const MODELS: Array<{ name: string; value: string }> = [
  { name: 'Gemini 3.5 Flash', value: 'gemini-3.5-flash' },
  { name: 'Gemini 3 Pro', value: 'gemini-3-pro' },
  { name: 'Gemini 3.1 Flash Lite', value: 'gemini-3.1-flash-lite' },
  { name: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro' },
  { name: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
  { name: 'Gemini 2.5 Flash Lite', value: 'gemini-2.5-flash-lite' },
];

export async function modelSearch(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
  const q = (filter ?? '').toLowerCase();
  const results = MODELS.filter((m) => m.name.toLowerCase().includes(q) || m.value.toLowerCase().includes(q));
  return { results };
}
