import { mockExecute } from '../../test/helpers';

jest.mock('../../transport/request', () => ({ apiRequest: jest.fn(async () => ({ candidates: [{ content: { parts: [{ text: 'hi there' }] } }] })) }));
import { apiRequest } from '../../transport/request';
import { execute, description } from './message.operation';

function paramFactory(values: Record<string, unknown>) {
  return (name: string, _i: number, fallback?: unknown) => (name in values ? values[name] : fallback);
}

describe('text message operation', () => {
  it('declares a required prompt scoped to text:message', () => {
    const prompt = description.find((d) => d.name === 'prompt')!;
    expect(prompt.required).toBe(true);
    expect(prompt.displayOptions?.show).toEqual({ resource: ['text'], operation: ['message'] });
  });

  it('sends history then the prompt and returns simplified text', async () => {
    const ctx = mockExecute();
    ctx.getNodeParameter.mockImplementation(paramFactory({
      prompt: 'how are you?',
      'messages.values': [{ role: 'user', text: 'hello' }, { role: 'model', text: 'hi' }],
      model: 'gemini-2.5-flash', projectId: 'p1', region: 'global', options: {},
    }));

    const result = await execute.call(ctx, 0);
    expect(result).toEqual([{ json: { text: 'hi there' } }]);
    const body = (apiRequest as jest.Mock).mock.calls[0][0].body;
    expect(body.contents).toHaveLength(3);
    expect(body.contents[2]).toEqual({ role: 'user', parts: [{ text: 'how are you?' }] });
  });
});
