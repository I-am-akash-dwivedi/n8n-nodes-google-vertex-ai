import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
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

export type OpExecute = (this: IExecuteFunctions, i: number) => Promise<INodeExecutionData[]>;

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

/**
 * Resolves the operation executor for the selected resource/operation, throwing a
 * NodeOperationError if the combination is not supported. The per-item loop and
 * continueOnFail handling live in the node's execute() method.
 */
export function resolveOperation(
  ctx: IExecuteFunctions,
  resource: string,
  operation: string,
): OpExecute {
  const execute = operations[resource]?.[operation];
  if (!execute) {
    throw new NodeOperationError(
      ctx.getNode(),
      `Unsupported operation "${operation}" for resource "${resource}"`,
    );
  }
  return execute;
}
