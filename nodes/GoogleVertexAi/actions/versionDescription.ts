/* eslint-disable n8n-nodes-base/node-filename-against-convention -- The node entry is GoogleVertexAi.node.ts; this file holds only the INodeTypeDescription, factored out for modularity. The rule assumes one inline node file. */
import type { INodeTypeDescription } from 'n8n-workflow';
import { commonFields, mediaInputFields, optionsCollection, imageModelField, imageOptionsCollection, imageInputCollection, videoModelField, videoOperationName, videoOutputField, videoOptionsCollection } from './descriptions';
import * as textMessage from './text/message.operation';
import * as imageAnalyze from './image/analyze.operation';
import * as imageGenerate from './image/generate.operation';
import * as imageEdit from './image/edit.operation';
import * as documentAnalyze from './document/analyze.operation';
import * as audioAnalyze from './audio/analyze.operation';
import * as audioTranscribe from './audio/transcribe.operation';
import * as videoAnalyze from './video/analyze.operation';
import * as videoGenerate from './video/generate.operation';

export const versionDescription: INodeTypeDescription = {
  displayName: 'Google Vertex AI',
  name: 'googleVertexAi',
  icon: 'file:googleVertexAi.svg',
  group: ['transform'],
  version: 1,
  subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
  description: 'Use Google Vertex AI (Gemini) for text, media analysis, and image generation/editing',
  defaults: { name: 'Google Vertex AI' },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [{ name: 'googleVertexAiApi', required: true, testedBy: 'googleVertexAiApiTest' }],
  properties: [
    {
      displayName: 'Resource',
      name: 'resource',
      type: 'options',
      noDataExpression: true,
      default: 'text',
      options: [
        { name: 'Audio', value: 'audio' },
        { name: 'Document', value: 'document' },
        { name: 'Image', value: 'image' },
        { name: 'Text', value: 'text' },
        { name: 'Video', value: 'video' },
      ],
    },
    {
      displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true, default: 'message',
      displayOptions: { show: { resource: ['text'] } },
      options: [
        { name: 'Message a Model', value: 'message', action: 'Message a model', description: 'Send a text prompt to a Gemini model and get a reply' },
      ],
    },
    {
      displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true, default: 'analyze',
      displayOptions: { show: { resource: ['image'] } },
      options: [
        { name: 'Analyze Image', value: 'analyze', action: 'Analyze an image', description: 'Take in images and answer questions about them' },
        { name: 'Edit Image', value: 'edit', action: 'Edit an image', description: 'Upload one or more images and apply edits based on a prompt' },
        { name: 'Generate an Image', value: 'generate', action: 'Generate an image', description: 'Creates an image from a text prompt' },
      ],
    },
    {
      displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true, default: 'analyze',
      displayOptions: { show: { resource: ['document'] } },
      options: [
        { name: 'Analyze Document', value: 'analyze', action: 'Analyze a document', description: 'Take in a document (PDF, etc.) and answer questions about it' },
      ],
    },
    {
      displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true, default: 'analyze',
      displayOptions: { show: { resource: ['audio'] } },
      options: [
        { name: 'Analyze Audio', value: 'analyze', action: 'Analyze audio', description: 'Take in audio and answer questions about it' },
        { name: 'Transcribe Audio', value: 'transcribe', action: 'Transcribe a recording', description: 'Transcribe a recording to text' },
      ],
    },
    {
      displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true, default: 'analyze',
      displayOptions: { show: { resource: ['video'] } },
      options: [
        { name: 'Analyze Video', value: 'analyze', action: 'Analyze a video', description: 'Take in a video and answer questions about it' },
        { name: 'Download Video', value: 'download', action: 'Download a video', description: 'Download the finished video as binary (decodes the base64 result)' },
        { name: 'Generate Video', value: 'generate', action: 'Generate a video', description: 'Start generating a video from a text prompt (Veo); returns an operation name' },
        { name: 'Get Video Status', value: 'status', action: 'Get video status', description: 'Check whether a video generation operation has finished' },
      ],
    },
    ...commonFields,
    imageModelField,
    imageInputCollection,
    videoModelField,
    videoOperationName,
    videoOutputField,
    ...mediaInputFields,
    ...textMessage.description,
    ...imageAnalyze.description,
    ...imageGenerate.description,
    ...imageEdit.description,
    ...documentAnalyze.description,
    ...audioAnalyze.description,
    ...audioTranscribe.description,
    ...videoAnalyze.description,
    ...videoGenerate.description,
    optionsCollection,
    imageOptionsCollection,
    videoOptionsCollection,
  ],
};
