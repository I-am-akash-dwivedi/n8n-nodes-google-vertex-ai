import { mockExecute } from '../test/helpers';

jest.mock('./text/message.operation', () => ({ description: [], execute: jest.fn(async () => [{ json: { ok: 'text' } }]) }));
jest.mock('./image/analyze.operation', () => ({ description: [], execute: jest.fn(async () => { throw new Error('boom'); }) }));
jest.mock('./document/analyze.operation', () => ({ description: [], execute: jest.fn() }));
jest.mock('./audio/analyze.operation', () => ({ description: [], execute: jest.fn() }));
jest.mock('./audio/transcribe.operation', () => ({ description: [], execute: jest.fn() }));
jest.mock('./video/analyze.operation', () => ({ description: [], execute: jest.fn() }));

import { GoogleVertexAi } from '../GoogleVertexAi.node';

const node = new GoogleVertexAi();

describe('node execute', () => {
  it('dispatches to the selected operation for each item', async () => {
    const ctx = mockExecute();
    ctx.getInputData.mockReturnValue([{ json: {} }]);
    ctx.getNodeParameter.mockImplementation((name: string) => (name === 'resource' ? 'text' : 'message'));
    const out = await node.execute.call(ctx);
    expect(out).toEqual([[{ json: { ok: 'text' }, pairedItem: { item: 0 } }]]);
  });

  it('honors continueOnFail by emitting an error item', async () => {
    const ctx = mockExecute();
    ctx.getInputData.mockReturnValue([{ json: {} }]);
    ctx.getNodeParameter.mockImplementation((name: string) => (name === 'resource' ? 'image' : 'analyze'));
    ctx.continueOnFail.mockReturnValue(true);
    const out = await node.execute.call(ctx);
    expect(out[0][0].json.error).toBe('boom');
  });

  it('throws for an unknown operation', async () => {
    const ctx = mockExecute();
    ctx.getInputData.mockReturnValue([{ json: {} }]);
    ctx.getNodeParameter.mockImplementation((name: string) => (name === 'resource' ? 'text' : 'doesNotExist'));
    await expect(node.execute.call(ctx)).rejects.toThrow();
  });

  it('re-throws the original error when continueOnFail is false', async () => {
    const ctx = mockExecute();
    ctx.getInputData.mockReturnValue([{ json: {} }]);
    ctx.getNodeParameter.mockImplementation((name: string) => (name === 'resource' ? 'image' : 'analyze'));
    ctx.continueOnFail.mockReturnValue(false);
    await expect(node.execute.call(ctx)).rejects.toThrow('boom');
  });
});
