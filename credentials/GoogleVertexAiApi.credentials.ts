import { ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

export class GoogleVertexAiApi implements ICredentialType {
	name = 'googleVertexAiApi';
	displayName = 'Google Vertex AI API';
	icon: Icon = 'file:googleVertexAi.svg';
	documentationUrl = 'https://docs.n8n.io/integrations/builtin/credentials/google/service-account/';
	properties: INodeProperties[] = [
		{
			displayName: 'Region',
			name: 'region',
			type: 'options',
			default: 'us-central1',
			description: 'Vertex AI location for requests. Use "Global" for the newest models if a region returns 404.',
			options: [
				{ name: 'asia-northeast1', value: 'asia-northeast1' },
				{ name: 'asia-southeast1', value: 'asia-southeast1' },
				{ name: 'europe-west1', value: 'europe-west1' },
				{ name: 'europe-west4', value: 'europe-west4' },
				{ name: 'Global', value: 'global' },
				{ name: 'us-central1', value: 'us-central1' },
				{ name: 'us-east1', value: 'us-east1' },
				{ name: 'us-east4', value: 'us-east4' },
				{ name: 'us-west1', value: 'us-west1' },
			],
		},
		{
			displayName: 'Project ID',
			name: 'projectId',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'my-gcp-project',
			description: 'The ID of the GCP project where Vertex AI is enabled',
		},
		{
			displayName: 'Service Account Email',
			name: 'clientEmail',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'name@my-gcp-project.iam.gserviceaccount.com',
			description: 'The client email address of the GCP service account',
		},
		{
			displayName: 'Private Key',
			name: 'privateKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			placeholder: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
			description: 'The private key of the service account (including the BEGIN/END lines)',
		},
	];
}
