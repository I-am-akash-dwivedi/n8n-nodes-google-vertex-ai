/* Minimal mock of IExecuteFunctions for unit tests. */
export function mockExecute(overrides: Record<string, unknown> = {}): any {
  return {
    getCredentials: jest.fn(),
    getNode: jest.fn(() => ({ name: 'Google Vertex AI', type: 'googleVertexAi' })),
    getNodeParameter: jest.fn(),
    getInputData: jest.fn(() => [{ json: {} }]),
    continueOnFail: jest.fn(() => false),
    helpers: {
      httpRequest: jest.fn(),
      assertBinaryData: jest.fn(),
      getBinaryDataBuffer: jest.fn(),
      prepareBinaryData: jest.fn(async (buffer: Buffer, fileName: string, mimeType: string) => ({
        data: buffer.toString('base64'),
        fileName,
        mimeType,
      })),
    },
    ...overrides,
  };
}
