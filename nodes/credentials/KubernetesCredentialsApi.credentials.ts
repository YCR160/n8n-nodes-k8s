import { ICredentialType, INodeProperties, IAuthenticateGeneric, Icon } from 'n8n-workflow';

export class KubernetesCredentialsApi implements ICredentialType {
	name = 'kubernetesCredentialsApi';
	displayName = 'Kubernetes Credentials';
	documentationUrl = 'https://github.com/kubernetes-client/javascript';
	icon: Icon = 'file:../Kubernetes/k8s.svg';
	genericAuth = false;
	properties: INodeProperties[] = [
		{
			displayName: 'Load From',
			name: 'loadFrom',
			type: 'options',
			options: [
				{
					name: 'Automatic',
					value: 'automatic',
				},
				{
					name: 'File',
					value: 'file',
				},
				{
					name: 'Content',
					value: 'content',
				},
			],
			default: 'automatic',
		},
		{
			displayName: 'File Path',
			name: 'filePath',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					loadFrom: ['file'],
				},
			},
		},
		{
			displayName: 'Content',
			name: 'content',
			type: 'string',
			default: '',
			typeOptions: {
				rows: 4,
			},
			displayOptions: {
				show: {
					loadFrom: ['content'],
				},
			},
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {},
	};
	test: undefined;
}
