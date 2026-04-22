import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class QualityMaxApi implements ICredentialType {
	name = 'qualityMaxApi';
	displayName = 'QualityMax API';
	documentationUrl = 'https://github.com/Quality-Max/n8n-nodes-qualitymax';
	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your QualityMax API token (starts with qm-). Generate one at qualitymax.io/settings.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://app.qualitymax.io',
			description: 'Base URL of your QualityMax instance. Use the default for cloud.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/projects',
			method: 'GET',
		},
	};
}
