import type { IExecuteFunctions, INodeExecutionData, JsonObject } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { apiRequest } from '../../transport/request';
import { formatVideoOutput, parseModelFromOperationName } from '../../helpers/utils';

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const operationName = this.getNodeParameter('operationName', i) as string;
  const outputField = (this.getNodeParameter('videoOutputField', i, 'data') as string) || 'data';
  const model = parseModelFromOperationName(operationName);
  if (!model) {
    throw new NodeOperationError(this.getNode(), 'Invalid operation name. Use the value returned by "Generate Video".', { itemIndex: i });
  }

  const operation = await apiRequest.call(this, { model, action: 'fetchPredictOperation', body: { operationName } });
  if (operation.done !== true) {
    throw new NodeOperationError(this.getNode(), 'The video is not ready yet. Poll "Get Video Status" until done is true, then download.', { itemIndex: i });
  }
  if (operation.error) {
    throw new NodeApiError(this.getNode(), operation.error as JsonObject);
  }

  return formatVideoOutput.call(this, operation, outputField);
}
