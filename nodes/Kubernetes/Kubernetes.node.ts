/* eslint-disable @n8n/community-nodes/resource-operation-pattern */
import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IExecuteFunctions,
	NodeOperationError,
} from 'n8n-workflow';
import { K8SClient } from './utils';

export class Kubernetes implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Kubernetes',
		name: 'kubernetes',
		icon: 'file:k8s.svg',
		group: ['output'],
		version: 1,
		usableAsTool: true,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Kubernetes',
		defaults: {
			name: 'Kubernetes',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'kubernetesCredentialsApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Delete',
						value: 'delete',
					},
					{
						name: 'Exec',
						value: 'exec',
					},
					{
						name: 'Get',
						value: 'get',
					},
					{
						name: 'List',
						value: 'list',
					},
					{
						name: 'Logs',
						value: 'logs',
					},
					{
						name: 'Patch',
						value: 'patch',
					},
					{
						name: 'Port Forward',
						value: 'port-forward',
					},
					{
						name: 'Restart',
						value: 'restart',
					},
					{
						name: 'Run',
						value: 'run',
					},
					{
						name: 'Scale',
						value: 'scale',
					},
				],
				default: 'run',
			},
			{
				displayName: 'Image',
				name: 'image',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['run', 'restart', 'exec', 'patch'],
					},
				},
			},
			{
				displayName: 'Command',
				name: 'command',
				type: 'json',
				default: '[]',
				displayOptions: {
					show: {
						operation: ['run', 'exec'],
					},
				},
			},
			{
				displayName: 'Environment Variables',
				name: 'env',
				type: 'json',
				default: '[]',
				displayOptions: {
					show: {
						operation: ['run', 'exec'],
					},
				},
			},
			{
				displayName: 'Namespace',
				name: 'namespace',
				type: 'string',
				default: 'default',
				displayOptions: {
					show: {
						operation: [
							'run',
							'restart',
							'exec',
							'list',
							'logs',
							'get',
							'delete',
							'scale',
							'patch',
						],
					},
				},
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'string',
				required: true,
				noDataExpression: false,
				default: 'pods',
				displayOptions: {
					show: {
						operation: [
							'run',
							'restart',
							'exec',
							'list',
							'logs',
							'get',
							'delete',
							'scale',
							'patch',
						],
					},
				},
				options: [
					{
						name: 'Namespaces',
						value: 'namespaces',
					},
					{
						name: 'Pods',
						value: 'pods',
					},
					{
						name: 'Services',
						value: 'services',
					},
					{
						name: 'Deployments',
						value: 'deployments',
					},
					{
						name: 'ReplicaSets',
						value: 'replicasets',
					},
					{
						name: 'StatefulSets',
						value: 'statefulsets',
					},
					{
						name: 'DaemonSets',
						value: 'daemonsets',
					},
					{
						name: 'Jobs',
						value: 'jobs',
					},
					{
						name: 'CronJobs',
						value: 'cronjobs',
					},
				],
			},
			{
				displayName: 'Resource Name',
				name: 'resourceName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: [
							'run',
							'restart',
							'exec',
							'list',
							'logs',
							'get',
							'delete',
							'scale',
							'patch',
						],
					},
				},
			},
			{
				displayName: 'Replicas',
				name: 'replicas',
				type: 'number',
				default: 1,
				displayOptions: {
					show: {
						operation: ['scale'],
					},
				},
			},
			{
				displayName: 'Patch Data',
				name: 'patchData',
				type: 'json',
				default: '{}',
				typeOptions: {
					rows: 4,
				},
				displayOptions: {
					show: {
						operation: ['patch'],
					},
				},
			},
			{
				displayName: 'Container Name',
				name: 'containerName',
				type: 'string',
				default: 'main-container',
				displayOptions: {
					show: {
						operation: ['exec', 'logs'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const result: INodeExecutionData[] = [];

		for (let idx = 0; idx < this.getInputData().length; idx++) {
			const credentials = await this.getCredentials('kubernetesCredentialsApi', idx);
			if (credentials === undefined) {
				throw new NodeOperationError(this.getNode(), 'No credentials got returned!');
			}

			const k8s = new K8SClient(credentials);
			let data: unknown = {};
			const parameters: {
				namespace: string;
				resource: string;
				resourceName: string;
				image: string;
				command: string[];
				env: string[];
				replicas: number;
				patchData: Record<string, unknown>;
				containerName: string;
			} = {
				namespace: '',
				resource: '',
				resourceName: '',
				image: '',
				command: [],
				env: [],
				replicas: 1,
				patchData: {},
				containerName: 'main-container',
			};

			Object.defineProperty(parameters, 'namespace', {
				get: () => (this.getNodeParameter('namespace', idx) as string) || 'default',
			});
			Object.defineProperty(parameters, 'resource', {
				get: () => this.getNodeParameter('resource', idx) as string,
			});
			Object.defineProperty(parameters, 'resourceName', {
				get: () => this.getNodeParameter('resourceName', idx) as string,
			});
			Object.defineProperty(parameters, 'image', {
				get: () => this.getNodeParameter('image', idx) as string,
			});
			Object.defineProperty(parameters, 'command', {
				get: () => JSON.parse((this.getNodeParameter('command', idx) as string) || '[]'),
			});
			Object.defineProperty(parameters, 'env', {
				get: () => JSON.parse((this.getNodeParameter('env', idx) as string) || '[]'),
			});
			Object.defineProperty(parameters, 'replicas', {
				get: () => (this.getNodeParameter('replicas', idx) as number) || 1,
			});
			Object.defineProperty(parameters, 'patchData', {
				get: () => JSON.parse((this.getNodeParameter('patchData', idx) as string) || '{}'),
			});
			Object.defineProperty(parameters, 'containerName', {
				get: () => this.getNodeParameter('containerName', idx) as string,
			});

			const operation = this.getNodeParameter('operation', idx) as string;

			switch (operation) {
				case 'run':
					if (!Array.isArray(parameters.command)) {
						throw new NodeOperationError(this.getNode(), 'Command must be an array!');
					}
					if (!Array.isArray(parameters.env)) {
						throw new NodeOperationError(this.getNode(), 'Env must be an array!');
					}

					data = {
						stdout: await k8s.runPodAndGetOutput(
							parameters.image,
							parameters.command,
							parameters.env,
							parameters.resourceName,
							parameters.namespace,
						),
					};
					break;

				case 'list':
					// For namespaces, we don't need a namespace parameter
					if (parameters.resource === 'namespaces') {
						data = await k8s.listNamespace();
					} else {
						// Convert plural to singular for the listWorkload method
						const singularResource = parameters.resource.replace(/s$/, '');
						data = await k8s.listWorkload(parameters.namespace, singularResource);
					}
					break;

				case 'get':
					if (!parameters.resourceName) {
						throw new NodeOperationError(
							this.getNode(),
							'Resource name is required for get operation!',
						);
					}
					// This would need to be implemented in K8SClient
					data = await k8s.getResource(
						parameters.namespace,
						parameters.resource,
						parameters.resourceName,
					);
					break;

				case 'delete':
					if (!parameters.resourceName) {
						throw new NodeOperationError(
							this.getNode(),
							'Resource name is required for delete operation!',
						);
					}
					// This would need to be implemented in K8SClient
					data = await k8s.deleteResource(
						parameters.namespace,
						parameters.resource,
						parameters.resourceName,
					);
					break;

				case 'logs':
					if (!parameters.resourceName) {
						throw new NodeOperationError(
							this.getNode(),
							'Resource name is required for logs operation!',
						);
					}

					// This would need to be implemented in K8SClient
					data = {
						logs: await k8s.getLogs(
							parameters.namespace,
							parameters.resourceName,
							parameters.containerName,
						),
					};
					break;

				case 'scale':
					if (!parameters.resourceName) {
						throw new NodeOperationError(
							this.getNode(),
							'Resource name is required for scale operation!',
						);
					}

					// This would need to be implemented in K8SClient
					data = await k8s.scaleResource(
						parameters.namespace,
						parameters.resource,
						parameters.resourceName,
						parameters.replicas,
					);
					break;

				case 'patch':
					if (!parameters.resourceName) {
						throw new NodeOperationError(
							this.getNode(),
							'Resource name is required for patch operation!',
						);
					}

					// This would need to be implemented in K8SClient
					data = await k8s.patchResource(
						parameters.namespace,
						parameters.resource,
						parameters.resourceName,
						parameters.patchData,
					);
					break;

				case 'exec':
					if (!parameters.resourceName) {
						throw new NodeOperationError(
							this.getNode(),
							'Resource name is required for exec operation!',
						);
					}

					// This would need to be implemented in K8SClient
					data = {
						stdout: await k8s.execCommand(
							parameters.namespace,
							parameters.resourceName,
							parameters.containerName,
							parameters.command,
						),
					};
					break;

				case 'restart':
					if (!parameters.resourceName) {
						throw new NodeOperationError(
							this.getNode(),
							'Resource name is required for restart operation!',
						);
					}
					// This would need to be implemented in K8SClient
					data = await k8s.restartResource(
						parameters.namespace,
						parameters.resource,
						parameters.resourceName,
					);
					break;

				case 'port-forward':
					if (!parameters.resourceName) {
						throw new NodeOperationError(
							this.getNode(),
							'Resource name is required for port-forward operation!',
						);
					}
					// This would need to be implemented in K8SClient
					data = await k8s.portForward(parameters.namespace, parameters.resourceName);
					break;

				default:
					throw new NodeOperationError(
						this.getNode(),
						`Operation "${operation}" not implemented yet.`,
					);
			}

			result.push({
				json: data as IDataObject,
				pairedItem: {
					item: idx,
				},
			});
		}

		return [result];
	}
}
