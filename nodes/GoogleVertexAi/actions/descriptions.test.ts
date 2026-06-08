import { commonFields, mediaInputFields, optionsCollection, imageModelField, imageOptionsCollection, imageInputCollection, videoModelField, videoOperationName, videoOptionsCollection } from './descriptions';

describe('shared descriptions', () => {
  it('exposes a model resourceLocator (projectId/region now live on the credential)', () => {
    const names = commonFields.map((f) => f.name);
    expect(names).toEqual(['model']);
    expect(names).not.toContain('projectId');
    expect(names).not.toContain('region');
    const model = commonFields.find((f) => f.name === 'model')!;
    expect(model.type).toBe('resourceLocator');
    // Hidden for image/video generation ops, which use their own model pickers.
    expect(model.displayOptions?.hide?.resource).toEqual(['image', 'video']);
    expect(model.displayOptions?.hide?.operation).toEqual(['generate', 'edit', 'status', 'download']);
  });
  it('uses shared media input only for document/audio/video (image has its own)', () => {
    const inputType = mediaInputFields.find((f) => f.name === 'inputType')!;
    expect(inputType.displayOptions?.show?.resource).toEqual(['document', 'audio', 'video']);
    expect(inputType.displayOptions?.show?.operation).toEqual(['analyze', 'transcribe']);
  });
  it('gives image analyze/edit a multi-image fixedCollection input', () => {
    expect(imageInputCollection.name).toBe('images');
    expect(imageInputCollection.type).toBe('fixedCollection');
    expect(imageInputCollection.typeOptions?.multipleValues).toBe(true);
    expect(imageInputCollection.displayOptions?.show?.operation).toEqual(['analyze', 'edit']);
    const inner = (imageInputCollection.options as Array<{ values: Array<{ name: string }> }>)[0];
    expect(inner.values.map((v) => v.name)).toContain('binaryField');
  });
  it('offers the Nano Banana image models for generate/edit', () => {
    expect(imageModelField.name).toBe('imageModel');
    const values = (imageModelField.options as Array<{ value: string }>).map((o) => o.value);
    expect(values).toContain('gemini-2.5-flash-image');
    expect(imageModelField.displayOptions?.show?.operation).toEqual(['generate', 'edit']);
  });
  it('provides image options incl. aspect ratio, image size, and output field (default "edited")', () => {
    expect(imageOptionsCollection.name).toBe('imageOptions');
    const options = imageOptionsCollection.options as Array<{ name: string; default?: unknown }>;
    const optionNames = options.map((o) => o.name);
    expect(optionNames).toEqual(expect.arrayContaining(['aspectRatio', 'imageSize', 'outputBinaryField']));
    expect(options.find((o) => o.name === 'outputBinaryField')?.default).toBe('edited');
  });
  it('exposes Veo video fields for generate/status/download', () => {
    expect(videoModelField.name).toBe('videoModel');
    expect((videoModelField.options as Array<{ value: string }>).map((o) => o.value)).toContain('veo-3.1-generate-001');
    expect(videoModelField.displayOptions?.show?.operation).toEqual(['generate']);
    expect(videoOperationName.displayOptions?.show?.operation).toEqual(['status', 'download']);
    expect(videoOptionsCollection.displayOptions?.show?.operation).toEqual(['generate']);
  });
  it('provides an options collection including simplify', () => {
    expect(optionsCollection.name).toBe('options');
    const optionNames = (optionsCollection.options as Array<{ name: string }>).map((o) => o.name);
    expect(optionNames).toContain('simplify');
  });
});
