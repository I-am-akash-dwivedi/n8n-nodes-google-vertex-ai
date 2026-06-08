import type {
	IAuthenticateGeneric,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IDataObject,
	IHttpRequestHelper,
	Icon,
	INodeProperties,
} from 'n8n-workflow';
import { signJwt, formatPrivateKey, TOKEN_URL } from '../nodes/GoogleVertexAi/helpers/utils';

interface TokenResponse { access_token: string }

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

	// Mints a Google OAuth2 access token from the service-account key (JWT-bearer
	// grant) before requests run. A failure here (bad key/email) surfaces as a
	// failed credential test. The token is exposed to `authenticate` and `test`
	// via `$credentials.accessToken`.
	async preAuthentication(
		this: IHttpRequestHelper,
		credentials: ICredentialDataDecryptedObject,
	): Promise<IDataObject> {
		const email = credentials.clientEmail as string;
		const privateKey = formatPrivateKey(credentials.privateKey as string);
		const assertion = signJwt(email, privateKey, Math.floor(Date.now() / 1000));

		const res = await this.helpers.httpRequest({
			method: 'POST',
			url: TOKEN_URL,
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
				assertion,
			}).toString(),
		});
		const data = (typeof res === 'string' ? JSON.parse(res) : res) as TokenResponse;
		return { accessToken: data.access_token };
	}

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};

	// Lists Google's Model Garden publisher models — a lightweight authenticated
	// GET that confirms the minted token works against Vertex AI. Uses the global
	// service host (publisher models are global resources), so the test validates
	// the service-account key independently of the selected region.
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://aiplatform.googleapis.com',
			url: '/v1/publishers/google/models',
		},
	};
}
