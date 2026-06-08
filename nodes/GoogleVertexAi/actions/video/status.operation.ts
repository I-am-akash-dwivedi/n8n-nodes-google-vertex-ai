import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest } from '../../transport/request';
import { extractVideos, parseModelFromOperationName } from '../../helpers/utils';

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
  const operationName = this.getNodeParameter('operationName', i) as string;
  const model = parseModelFromOperationName(operationName);
  if (!model) {
    throw new NodeOperationError(this.getNode(), 'Invalid operation name. Use the value returned by "Generate Video".', { itemIndex: i });
  }

  const operation = await apiRequest.call(this, { model, action: 'fetchPredictOperation', body: { operationName } });
  const done = operation.done === true;
  const error = operation.error as IDataObject | undefined;

  return [{
    json: {
      operationName,
      done,
      ...(error ? { error } : {}),
      ...(done && !error ? { videoCount: extractVideos(operation).length } : {}),
    },
  }];
}
