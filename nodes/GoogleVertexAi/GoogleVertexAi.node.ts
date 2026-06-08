/* eslint-disable @n8n/community-nodes/icon-validation, @n8n/community-nodes/require-continue-on-fail --
   icon-validation: the icon ('file:googleVertexAi.svg') is declared on the description in actions/versionDescription.ts; the rule can't follow the imported description.
   require-continue-on-fail: continueOnFail() is handled per input item in actions/router.ts; the rule can't see through the router delegation. */
import type { IExecuteFunctions, INodeExecutionData, INodeType } from 'n8n-workflow';
import { versionDescription } from './actions/versionDescription';
import { router } from './actions/router';
import * as listSearch from './methods/listSearch';
import { googleVertexAiApiTest } from './methods/credentialTest';

export class GoogleVertexAi implements INodeType {
  description = versionDescription;

  methods = {
    listSearch,
    credentialTest: { googleVertexAiApiTest },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    return await router.call(this);
  }
}
