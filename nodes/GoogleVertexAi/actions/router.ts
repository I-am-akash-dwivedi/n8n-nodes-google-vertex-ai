import type { IExecuteFunctions, INodeExecutionData, JsonObject } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import * as textMessage from './text/message.operation';
import * as imageAnalyze from './image/analyze.operation';
import * as imageGenerate from './image/generate.operation';
import * as imageEdit from './image/edit.operation';
import * as documentAnalyze from './document/analyze.operation';
import * as audioAnalyze from './audio/analyze.operation';
import * as audioTranscribe from './audio/transcribe.operation';
import * as videoAnalyze from './video/analyze.operation';
import * as videoGenerate from './video/generate.operation';
import * as videoStatus from './video/status.operation';
import * as videoDownload from './video/download.operation';

type OpExecute = (this: IExecuteFunctions, i: number) => Promise<INodeExecutionData[]>;

const operations: Record<string, Record<string, OpExecute>> = {
  text: { message: textMessage.execute },
  image: { analyze: imageAnalyze.execute, generate: imageGenerate.execute, edit: imageEdit.execute },
  document: { analyze: documentAnalyze.execute },
  audio: { analyze: audioAnalyze.execute, transcribe: audioTranscribe.execute },
  video: {
    analyze: videoAnalyze.execute,
    generate: videoGenerate.execute,
    status: videoStatus.execute,
    download: videoDownload.execute,
  },
};

export async function router(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
  const items = this.getInputData();
  const resource = this.getNodeParameter('resource', 0) as string;
  const operation = this.getNodeParameter('operation', 0) as string;

  const execute = operations[resource]?.[operation];
  if (!execute) {
    throw new NodeOperationError(this.getNode(), `Unsupported operation "${operation}" for resource "${resource}"`);
  }

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
        : new NodeApiError(this.getNode(), error as JsonObject);
    }
  }
  return [returnData];
}
