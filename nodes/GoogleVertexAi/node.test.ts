import { GoogleVertexAi } from './GoogleVertexAi.node';

describe('GoogleVertexAi node', () => {
  const node = new GoogleVertexAi();

  it('declares the googleVertexAiApi credential (tested by a node method) and a model search method', () => {
    expect(node.description.credentials).toEqual([
      { name: 'googleVertexAiApi', required: true, testedBy: 'googleVertexAiApiTest' },
    ]);
    expect(node.methods.listSearch.modelSearch).toBeDefined();
    expect(node.methods.credentialTest.googleVertexAiApiTest).toBeDefined();
  });

  it('exposes all five resources', () => {
    const resource = node.description.properties.find((p) => p.name === 'resource')!;
    const values = (resource.options as Array<{ value: string }>).map((o) => o.value);
    expect(values).toEqual(['audio', 'document', 'image', 'text', 'video']);
  });

  it('declares an operation selector for every resource', () => {
    const opSelectors = node.description.properties.filter((p) => p.name === 'operation');
    const covered = opSelectors.flatMap((p) => (p.displayOptions?.show?.resource as string[]) ?? []);
    expect(new Set(covered)).toEqual(new Set(['text', 'image', 'document', 'audio', 'video']));
  });

  it('exposes analyze, generate, and edit for the image resource', () => {
    const imageOpSelectors = node.description.properties.filter(
      (p) => p.name === 'operation' && ((p.displayOptions?.show?.resource as string[]) ?? []).includes('image'),
    );
    const values = imageOpSelectors.flatMap((p) => (p.options as Array<{ value: string }>).map((o) => o.value));
    expect(new Set(values)).toEqual(new Set(['analyze', 'generate', 'edit']));
  });

  it('exposes analyze, generate, status, and download for the video resource', () => {
    const videoOpSelectors = node.description.properties.filter(
      (p) => p.name === 'operation' && ((p.displayOptions?.show?.resource as string[]) ?? []).includes('video'),
    );
    const values = videoOpSelectors.flatMap((p) => (p.options as Array<{ value: string }>).map((o) => o.value));
    expect(new Set(values)).toEqual(new Set(['analyze', 'generate', 'status', 'download']));
  });

  it('includes a prompt field for each resource', () => {
    const prompts = node.description.properties.filter((p) => p.name === 'prompt');
    const resources = prompts.flatMap((p) => (p.displayOptions?.show?.resource as string[]) ?? []);
    expect(new Set(resources)).toEqual(new Set(['text', 'image', 'document', 'audio', 'video']));
  });
});
