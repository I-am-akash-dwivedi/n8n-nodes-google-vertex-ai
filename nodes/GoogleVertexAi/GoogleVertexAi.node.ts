import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { versionDescription } from './actions/versionDescription';
import { resolveOperation } from './actions/router';
import * as listSearch from './methods/listSearch';

export class GoogleVertexAi implements INodeType {
  description: INodeTypeDescription = {
    ...versionDescription,
    icon: 'file:googleVertexAi.svg',
    subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
    usableAsTool: true,
    // The credential test lives on the credential itself (declarative test +
    // preAuthentication); see GoogleVertexAiApi.credentials.ts.
    credentials: [{ name: 'googleVertexAiApi', required: true }],
  };

  methods = {
    listSearch,
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;
    const execute = resolveOperation(this, resource, operation);

    const returnData: INodeExecutionData[] = [];
    for (let i = 0; i < items.length; i++) {
      try {
        const results = await execute.call(this, i);
        returnData.push(...results.map((item) => ({ ...item, pairedItem: { item: i } })));
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
          continue;
        }
        throw error instanceof NodeOperationError || error instanceof NodeApiError
          ? error
          : new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
      }
    }
    return [returnData];
  }
}
