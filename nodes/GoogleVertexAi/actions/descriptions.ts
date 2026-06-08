import type { INodeProperties } from 'n8n-workflow';

// Resources whose analyze/transcribe ops use the shared single-file input (binary or GCS URI).
const SHARED_MEDIA_RESOURCES = ['document', 'audio', 'video'];
const MEDIA_INPUT_OPERATIONS = ['analyze', 'transcribe'];
// Image operations that take one or more input images.
const IMAGE_INPUT_OPERATIONS = ['analyze', 'edit'];
// Image operations that produce an image and use the Nano Banana models.
const IMAGE_GEN_OPERATIONS = ['generate', 'edit'];
// Ops that don't use the Gemini text model / text-options (image + video generation ops).
const NON_GEMINI_OPS = ['generate', 'edit', 'status', 'download'];

export const commonFields: INodeProperties[] = [
  {
    displayName: 'Model',
    name: 'model',
    type: 'resourceLocator',
    default: { mode: 'list', value: 'gemini-2.5-flash' },
    required: true,
    // Hidden for image generate/edit, which use the dedicated image-model picker.
    displayOptions: { hide: { resource: ['image', 'video'], operation: NON_GEMINI_OPS } },
    modes: [
      { displayName: 'From List', name: 'list', type: 'list', typeOptions: { searchListMethod: 'modelSearch', searchable: true } },
      { displayName: 'By ID', name: 'id', type: 'string', placeholder: 'gemini-2.5-flash' },
    ],
  },
];

export const imageModelField: INodeProperties = {
  displayName: 'Image Model',
  name: 'imageModel',
  type: 'options',
  default: 'gemini-2.5-flash-image',
  required: true,
  description: 'The Gemini image ("Nano Banana") model to use',
  displayOptions: { show: { resource: ['image'], operation: IMAGE_GEN_OPERATIONS } },
  options: [
    { name: 'Gemini 2.5 Flash Image (Nano Banana)', value: 'gemini-2.5-flash-image' },
    { name: 'Gemini 3 Pro Image (Nano Banana Pro)', value: 'gemini-3-pro-image' },
    { name: 'Gemini 3 Pro Image Preview', value: 'gemini-3-pro-image-preview' },
    { name: 'Gemini 3.1 Flash Image (Nano Banana 2)', value: 'gemini-3.1-flash-image' },
  ],
};

// Multi-image input for image analyze/edit: add one or more binary images.
export const imageInputCollection: INodeProperties = {
  displayName: 'Images',
  name: 'images',
  type: 'fixedCollection',
  typeOptions: { multipleValues: true, sortable: true },
  placeholder: 'Add Image',
  default: { image: [{ binaryField: 'data' }] },
  description: 'The input image(s), each taken from a binary property on the incoming item',
  displayOptions: { show: { resource: ['image'], operation: IMAGE_INPUT_OPERATIONS } },
  options: [
    {
      name: 'image',
      displayName: 'Image',
      values: [
        {
          displayName: 'Binary Field Name',
          name: 'binaryField',
          type: 'string',
          default: 'data',
          description: 'Name of the binary property holding the image',
        },
      ],
    },
  ],
};

export const mediaInputFields: INodeProperties[] = [
  {
    displayName: 'Input Type',
    name: 'inputType',
    type: 'options',
    default: 'binary',
    options: [
      { name: 'Binary File', value: 'binary' },
      { name: 'Google Cloud Storage URI', value: 'url' },
    ],
    displayOptions: { show: { resource: SHARED_MEDIA_RESOURCES, operation: MEDIA_INPUT_OPERATIONS } },
  },
  {
    displayName: 'Input Binary Field',
    name: 'binaryPropertyName',
    type: 'string',
    default: 'data',
    description: 'Name of the binary property holding the file',
    displayOptions: { show: { resource: SHARED_MEDIA_RESOURCES, operation: MEDIA_INPUT_OPERATIONS, inputType: ['binary'] } },
  },
  {
    displayName: 'GCS URI',
    name: 'fileUri',
    type: 'string',
    default: '',
    placeholder: 'gs://bucket/path/file.ext',
    displayOptions: { show: { resource: SHARED_MEDIA_RESOURCES, operation: MEDIA_INPUT_OPERATIONS, inputType: ['url'] } },
  },
  {
    displayName: 'MIME Type',
    name: 'mimeType',
    type: 'string',
    default: '',
    placeholder: 'application/pdf, audio/mp3, video/mp4',
    description: 'Optional for binary (auto-detected). Required for a GCS URI.',
    displayOptions: { show: { resource: SHARED_MEDIA_RESOURCES, operation: MEDIA_INPUT_OPERATIONS } },
  },
];

export const optionsCollection: INodeProperties = {
  displayName: 'Options',
  name: 'options',
  type: 'collection',
  placeholder: 'Add Option',
  default: {},
  // Text/analyze generation options; image generate/edit use imageOptionsCollection.
  displayOptions: { hide: { resource: ['image', 'video'], operation: NON_GEMINI_OPS } },
  options: [
    { displayName: 'JSON Output', name: 'jsonOutput', type: 'boolean', default: false, description: 'Whether to ask the model to return JSON' },
    { displayName: 'Max Output Tokens', name: 'maxOutputTokens', type: 'number', typeOptions: { minValue: 1 }, default: 1024 },
    { displayName: 'Simplify Output', name: 'simplify', type: 'boolean', default: true, description: 'Whether to return only the generated text instead of the full API response' },
    { displayName: 'System Instruction', name: 'systemInstruction', type: 'string', typeOptions: { rows: 2 }, default: '' },
    { displayName: 'Temperature', name: 'temperature', type: 'number', typeOptions: { minValue: 0, maxValue: 2, numberPrecision: 2 }, default: 0.7 },
    { displayName: 'Top K', name: 'topK', type: 'number', typeOptions: { minValue: 1 }, default: 40 },
    { displayName: 'Top P', name: 'topP', type: 'number', typeOptions: { minValue: 0, maxValue: 1, numberPrecision: 2 }, default: 0.95 },
  ],
};

export const imageOptionsCollection: INodeProperties = {
  displayName: 'Options',
  name: 'imageOptions',
  type: 'collection',
  placeholder: 'Add Option',
  default: {},
  displayOptions: { show: { resource: ['image'], operation: IMAGE_GEN_OPERATIONS } },
  options: [
    {
      displayName: 'Aspect Ratio',
      name: 'aspectRatio',
      type: 'string',
      default: '',
      placeholder: '16:9',
      description: 'Output aspect ratio, e.g. 1:1, 16:9, 9:16, 4:3, 3:4. Leave blank for the model default.',
    },
    {
      displayName: 'Image Size',
      name: 'imageSize',
      type: 'options',
      default: '1K',
      description: 'Output resolution. 2K/4K are supported by the Gemini 3 image models.',
      options: [
        { name: '1K', value: '1K' },
        { name: '2K', value: '2K' },
        { name: '4K', value: '4K' },
      ],
    },
    {
      displayName: 'Put Output In Field',
      name: 'outputBinaryField',
      type: 'string',
      default: 'edited',
      description: 'Name of the output binary field to store the generated image in. Additional images get a numeric suffix (e.g. edited1).',
    },
  ],
};

export const videoModelField: INodeProperties = {
  displayName: 'Video Model',
  name: 'videoModel',
  type: 'options',
  default: 'veo-3.1-generate-001',
  required: true,
  description: 'The Veo video-generation model to use',
  displayOptions: { show: { resource: ['video'], operation: ['generate'] } },
  options: [
    { name: 'Veo 2', value: 'veo-2.0-generate-001' },
    { name: 'Veo 3', value: 'veo-3.0-generate-001' },
    { name: 'Veo 3 Fast', value: 'veo-3.0-fast-generate-001' },
    { name: 'Veo 3.1', value: 'veo-3.1-generate-001' },
    { name: 'Veo 3.1 Fast', value: 'veo-3.1-fast-generate-001' },
  ],
};

export const videoOperationName: INodeProperties = {
  displayName: 'Operation Name',
  name: 'operationName',
  type: 'string',
  default: '',
  required: true,
  placeholder: 'projects/.../publishers/google/models/.../operations/...',
  description: 'The operation name returned by "Generate Video"',
  displayOptions: { show: { resource: ['video'], operation: ['status', 'download'] } },
};

export const videoOutputField: INodeProperties = {
  displayName: 'Put Output In Field',
  name: 'videoOutputField',
  type: 'string',
  default: 'data',
  required: true,
  description: 'Name of the output binary field that will hold the downloaded video',
  displayOptions: { show: { resource: ['video'], operation: ['download'] } },
};

export const videoOptionsCollection: INodeProperties = {
  displayName: 'Options',
  name: 'videoOptions',
  type: 'collection',
  placeholder: 'Add Option',
  default: {},
  displayOptions: { show: { resource: ['video'], operation: ['generate'] } },
  options: [
    {
      displayName: 'Aspect Ratio',
      name: 'aspectRatio',
      type: 'options',
      default: '16:9',
      options: [
        { name: '16:9', value: '16:9' },
        { name: '9:16', value: '9:16' },
      ],
    },
    {
      displayName: 'Duration (Seconds)',
      name: 'durationSeconds',
      type: 'options',
      default: '8',
      description: 'Clip length. Allowed values vary by model (Veo 3.1: 4, 6, or 8).',
      options: [
        { name: '4', value: '4' },
        { name: '6', value: '6' },
        { name: '8', value: '8' },
      ],
    },
    { displayName: 'Generate Audio', name: 'generateAudio', type: 'boolean', default: true, description: 'Whether to generate audio (Veo 3 and later)' },
    { displayName: 'Negative Prompt', name: 'negativePrompt', type: 'string', default: '', description: 'What to avoid in the generated video' },
    {
      displayName: 'Resolution',
      name: 'resolution',
      type: 'string',
      default: '720p',
      placeholder: '720p',
      description: 'Output resolution: 720p (default), 1080p, or 4k. 1080p/4k require an 8s duration and Veo 3.x.',
    },
    { displayName: 'Sample Count', name: 'sampleCount', type: 'number', typeOptions: { minValue: 1, maxValue: 4 }, default: 1, description: 'Number of videos to generate' },
  ],
};
