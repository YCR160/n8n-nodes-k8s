/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { Writable } from 'node:stream';
// @ts-expect-error The type definition for k8s is not complete, so we need to ignore the error
import * as k8s from '@kubernetes/client-node';

import { LoggerProxy as Logger, ICredentialDataDecryptedObject } from 'n8n-workflow';
Logger.init(console);

export class K8SClient {
	private kubeConfig: k8s.KubeConfig;

	constructor(credentials: ICredentialDataDecryptedObject) {
		if (!credentials) {
			throw new Error('No credentials got returned!');
		}

		const kubeConfig = new k8s.KubeConfig();

		switch (credentials.loadFrom) {
			case 'automatic':
				kubeConfig.loadFromDefault();
				break;
			case 'file':
				if (typeof credentials.filePath !== 'string' || credentials.filePath === '') {
					throw new Error('File path is required!');
				}
				kubeConfig.loadFromFile(credentials.filePath);
				break;
			case 'content':
				if (typeof credentials.content !== 'string' || credentials.content === '') {
					throw new Error('Content is required!');
				}
				kubeConfig.loadFromString(credentials.content);
				break;
			default:
				throw new Error(`Unknown loadFrom: ${credentials.loadFrom}`);
		}

		this.kubeConfig = kubeConfig;
	}

	// listNamespace returns a list of namespaces
	async listNamespace() {
		const k8sCoreApi = this.kubeConfig.makeApiClient(k8s.CoreV1Api);
		const resp = await k8sCoreApi.listNamespace();
		return resp.items;
	}

	// listWorkload returns a list of workloads
	async listWorkload(namespace = 'default', resource = 'deployment') {
		const k8sAppsApi = this.kubeConfig.makeApiClient(k8s.AppsV1Api);
		const k8sBatchApi = this.kubeConfig.makeApiClient(k8s.BatchV1Api);
		const k8sCoreApi = this.kubeConfig.makeApiClient(k8s.CoreV1Api);
		const k8sRbacApi = this.kubeConfig.makeApiClient(k8s.RbacAuthorizationV1Api);

		switch (resource) {
			case 'deployment':
			case 'deployments':
				return (await k8sAppsApi.listNamespacedDeployment({ namespace })).items;
			case 'statefulSet':
			case 'statefulsets':
				return (await k8sAppsApi.listNamespacedStatefulSet({ namespace })).items;
			case 'daemonSet':
			case 'daemonsets':
				return (await k8sAppsApi.listNamespacedDaemonSet({ namespace })).items;
			case 'cronJob':
			case 'cronjobs':
				return (await k8sBatchApi.listNamespacedCronJob({ namespace })).items;
			case 'job':
			case 'jobs':
				return (await k8sBatchApi.listNamespacedJob({ namespace })).items;
			case 'pod':
			case 'pods':
				return (await k8sCoreApi.listNamespacedPod({ namespace })).items;
			case 'service':
			case 'services':
				return (await k8sCoreApi.listNamespacedService({ namespace })).items;
			case 'configMap':
			case 'configmaps':
				return (await k8sCoreApi.listNamespacedConfigMap({ namespace })).items;
			case 'secret':
			case 'secrets':
				return (await k8sCoreApi.listNamespacedSecret({ namespace })).items;
			case 'role':
			case 'roles':
				return (await k8sRbacApi.listNamespacedRole({ namespace })).items;
			case 'roleBinding':
			case 'rolebindings':
				return (await k8sRbacApi.listNamespacedRoleBinding({ namespace })).items;
			case 'serviceAccount':
			case 'serviceaccounts':
				return (await k8sCoreApi.listNamespacedServiceAccount({ namespace })).items;
			default:
				throw new Error(`Unknown resource ${resource}`);
		}
	}

	// getResource gets a specific resource
	async getResource(namespace: string, resource: string, resourceName: string) {
		const k8sAppsApi = this.kubeConfig.makeApiClient(k8s.AppsV1Api);
		const k8sBatchApi = this.kubeConfig.makeApiClient(k8s.BatchV1Api);
		const k8sCoreApi = this.kubeConfig.makeApiClient(k8s.CoreV1Api);

		// Normalize resource name (convert to singular)
		const normalizedResource = resource.replace(/s$/, '');

		switch (normalizedResource) {
			case 'namespace':
				return await k8sCoreApi.readNamespace({ name: resourceName });
			case 'pod':
				return await k8sCoreApi.readNamespacedPod({ name: resourceName, namespace });
			case 'service':
				return await k8sCoreApi.readNamespacedService({ name: resourceName, namespace });
			case 'deployment':
				return await k8sAppsApi.readNamespacedDeployment({ name: resourceName, namespace });
			case 'statefulSet':
				return await k8sAppsApi.readNamespacedStatefulSet({ name: resourceName, namespace });
			case 'daemonSet':
				return await k8sAppsApi.readNamespacedDaemonSet({ name: resourceName, namespace });
			case 'job':
				return await k8sBatchApi.readNamespacedJob({ name: resourceName, namespace });
			case 'cronJob':
				return await k8sBatchApi.readNamespacedCronJob({ name: resourceName, namespace });
			default:
				throw new Error(`Unknown resource type: ${resource}`);
		}
	}

	// deleteResource deletes a specific resource
	async deleteResource(namespace: string, resource: string, resourceName: string) {
		const k8sAppsApi = this.kubeConfig.makeApiClient(k8s.AppsV1Api);
		const k8sBatchApi = this.kubeConfig.makeApiClient(k8s.BatchV1Api);
		const k8sCoreApi = this.kubeConfig.makeApiClient(k8s.CoreV1Api);

		// Normalize resource name (convert to singular)
		const normalizedResource = resource.replace(/s$/, '');

		switch (normalizedResource) {
			case 'pod':
				return await k8sCoreApi.deleteNamespacedPod({ name: resourceName, namespace });
			case 'service':
				return await k8sCoreApi.deleteNamespacedService({ name: resourceName, namespace });
			case 'deployment':
				return await k8sAppsApi.deleteNamespacedDeployment({ name: resourceName, namespace });
			case 'statefulSet':
				return await k8sAppsApi.deleteNamespacedStatefulSet({ name: resourceName, namespace });
			case 'daemonSet':
				return await k8sAppsApi.deleteNamespacedDaemonSet({ name: resourceName, namespace });
			case 'job':
				return await k8sBatchApi.deleteNamespacedJob({ name: resourceName, namespace });
			case 'cronJob':
				return await k8sBatchApi.deleteNamespacedCronJob({ name: resourceName, namespace });
			default:
				throw new Error(`Unknown resource type: ${resource}`);
		}
	}

	// getLogs gets logs from a pod
	async getLogs(
		namespace: string,
		podName: string,
		containerName: string = 'main-container',
	): Promise<string> {
		const k8sCoreApi = this.kubeConfig.makeApiClient(k8s.CoreV1Api);

		try {
			const logs = await k8sCoreApi.readNamespacedPodLog({
				name: podName,
				namespace,
				container: containerName,
			});
			return logs;
		} catch (error) {
			throw new Error(
				`Failed to get logs: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	// scaleResource scales a deployment, statefulset, etc.
	async scaleResource(namespace: string, resource: string, resourceName: string, replicas: number) {
		const k8sAppsApi = this.kubeConfig.makeApiClient(k8s.AppsV1Api);

		// Normalize resource name (convert to singular)
		const normalizedResource = resource.replace(/s$/, '');

		const scaleBody = {
			spec: {
				replicas: replicas,
			},
		};

		switch (normalizedResource) {
			case 'deployment':
				return await k8sAppsApi.patchNamespacedDeploymentScale({
					name: resourceName,
					namespace,
					body: scaleBody,
				});
			case 'statefulSet':
				return await k8sAppsApi.patchNamespacedStatefulSetScale({
					name: resourceName,
					namespace,
					body: scaleBody,
				});
			case 'daemonSet':
				// DaemonSets don't have a scale subresource in the same way
				// We can patch the spec directly
				return await k8sAppsApi.patchNamespacedDaemonSet({
					name: resourceName,
					namespace,
					body: scaleBody,
				});
			default:
				throw new Error(`Scaling not supported for resource type: ${resource}`);
		}
	}

	// patchResource patches a resource with the given data
	async patchResource(
		namespace: string,
		resource: string,
		resourceName: string,
		patchData: unknown,
	) {
		const k8sAppsApi = this.kubeConfig.makeApiClient(k8s.AppsV1Api);
		const k8sBatchApi = this.kubeConfig.makeApiClient(k8s.BatchV1Api);
		const k8sCoreApi = this.kubeConfig.makeApiClient(k8s.CoreV1Api);

		// Normalize resource name (convert to singular)
		const normalizedResource = resource.replace(/s$/, '');

		switch (normalizedResource) {
			case 'pod':
				return await k8sCoreApi.patchNamespacedPod({
					name: resourceName,
					namespace,
					body: patchData,
				});
			case 'service':
				return await k8sCoreApi.patchNamespacedService({
					name: resourceName,
					namespace,
					body: patchData,
				});
			case 'deployment':
				return await k8sAppsApi.patchNamespacedDeployment({
					name: resourceName,
					namespace,
					body: patchData,
				});
			case 'statefulSet':
				return await k8sAppsApi.patchNamespacedStatefulSet({
					name: resourceName,
					namespace,
					body: patchData,
				});
			case 'daemonSet':
				return await k8sAppsApi.patchNamespacedDaemonSet({
					name: resourceName,
					namespace,
					body: patchData,
				});
			case 'job':
				return await k8sBatchApi.patchNamespacedJob({
					name: resourceName,
					namespace,
					body: patchData,
				});
			case 'cronJob':
				return await k8sBatchApi.patchNamespacedCronJob({
					name: resourceName,
					namespace,
					body: patchData,
				});
			default:
				throw new Error(`Patching not supported for resource type: ${resource}`);
		}
	}

	// execCommand executes a command in a container
	async execCommand(
		namespace: string,
		podName: string,
		containerName: string,
		command: string[],
	): Promise<string> {
		const k8sExec = new k8s.Exec(this.kubeConfig);

		return new Promise((resolve, reject) => {
			let output = '';

			k8sExec.exec(
				namespace,
				podName,
				containerName,
				command,

				// Create a writable stream to capture stdout
				new Writable({
					write(chunk, encoding, callback) {
						output += chunk.toString();
						callback();
					},
				}),

				// Stderr
				new Writable({
					write(chunk, encoding, callback) {
						output += chunk.toString();
						callback();
					},
				}),

				// Input is not used in this implementation
				null,

				// Options
				true,

				// Callback
				(err) => {
					if (err) {
						reject(new Error(`Exec command failed: ${err.message}`));
					} else {
						resolve(output);
					}
				},
			);
		});
	}

	// restartResource restarts a resource (typically by patching the resource to trigger a restart)
	async restartResource(namespace: string, resource: string, resourceName: string) {
		const k8sAppsApi = this.kubeConfig.makeApiClient(k8s.AppsV1Api);

		// Normalize resource name (convert to singular)
		const normalizedResource = resource.replace(/s$/, '');

		// Add an annotation with the current time to force a restart
		const patchData = {
			spec: {
				template: {
					metadata: {
						annotations: {
							'kubectl.kubernetes.io/restartedAt': new Date().toISOString(),
						},
					},
				},
			},
		};

		switch (normalizedResource) {
			case 'deployment':
				return await k8sAppsApi.patchNamespacedDeployment({
					name: resourceName,
					namespace,
					body: patchData,
				});
			case 'statefulSet':
				return await k8sAppsApi.patchNamespacedStatefulSet({
					name: resourceName,
					namespace,
					body: patchData,
				});
			case 'daemonSet':
				return await k8sAppsApi.patchNamespacedDaemonSet({
					name: resourceName,
					namespace,
					body: patchData,
				});
			default:
				throw new Error(`Restart not supported for resource type: ${resource}`);
		}
	}

	// portForward creates a port forward from a pod
	async portForward(
		namespace: string,
		podName: string,
	): Promise<{ localPort: number; remotePort: number }> {
		// This is a simplified implementation
		// In a real implementation, you would need to handle the port forward properly
		const k8sCoreV1Api = this.kubeConfig.makeApiClient(k8s.CoreV1Api);

		// Get the pod to check its ports
		const pod = await k8sCoreV1Api.readNamespacedPod({ name: podName, namespace });

		if (pod.spec?.containers?.[0]?.ports?.[0]) {
			const remotePort = pod.spec.containers[0].ports[0].containerPort;

			// In a real implementation, you would create an actual port forward
			// This is just a placeholder that returns the first port found
			return {
				localPort: remotePort,
				remotePort: remotePort,
			};
		}

		throw new Error('No ports found on pod');
	}

	// listPod returns a list of pods
	static async listPod(kubeConfig: k8s.KubeConfig, namespace = 'default') {
		const k8sCoreApi = kubeConfig.makeApiClient(k8s.CoreV1Api);
		return await k8sCoreApi.listNamespacedPod({ namespace });
	}

	async runPodAndGetOutput(
		image: string,
		args: string[],
		env: string[],
		podName?: string,
		namespace = 'default',
	) {
		const kc = this.kubeConfig;
		const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
		const watch = new k8s.Watch(kc);

		podName = podName || `n8n-pod-${Date.now()}`;

		// 安全地解析环境变量，添加错误处理
		const parsedEnv = env.map((e) => {
			const parts = e.split('=');
			if (parts.length < 2) {
				throw new Error(`Invalid environment variable format: ${e}. Expected format: KEY=VALUE`);
			}
			return { name: parts[0], value: parts.slice(1).join('=') };
		});

		const podSpec = {
			metadata: {
				name: podName,
			},
			spec: {
				restartPolicy: 'Never',
				containers: [
					{
						name: 'main-container',
						image: image,
						args,
						env: parsedEnv,
					},
				],
			},
		} as k8s.V1Pod;

		await k8sCoreApi.createNamespacedPod({ namespace, body: podSpec });

		let result = '';

		try {
			let watchReq: AbortController | null = null;
			Logger.debug(`created pod ${podName} in ${namespace}.`);
			const watchPromise = new Promise<string>((resolve, reject) => {
				try {
					(async () => {
						watchReq = await watch.watch(
							`/api/v1/namespaces/${namespace}/pods`,
							{},
							async (phase: string, apiObj: k8s.V1Pod, obj: k8s.V1Pod) => {
								Logger.debug(`watch pods phase: ${phase}, pod: ${JSON.stringify(obj)}`, {
									obj,
									apiObj,
								});
								// throw new Error(
								// 				`watch pods phase: ${phase}, pod: ${obj.metadata?.name}`
								// 			);
								if (apiObj.metadata?.name !== podName) {
									return;
								}
								const status = apiObj.status?.phase;
								if (status === 'Succeeded' || status === 'Failed') {
									try {
										// 使用 readNamespacedPodLog 方法直接获取日志
										const logsResponse = await k8sCoreApi.readNamespacedPodLog({
											name: podName,
											namespace,
											container: 'main-container',
										});

										resolve(logsResponse);
										if (watchReq) {
											watchReq.abort();
										}
									} catch (err) {
										if (watchReq) {
											watchReq.abort();
										}
										reject(
											new Error(
												`Failed to get logs: ${err instanceof Error ? err.message : String(err)}`,
											),
										);
									}
								}
							},
							(err: Error) => {
								console.error('watch pods error', err);
								if (watchReq) {
									watchReq.abort();
								}
								reject(err);
							},
						);
					})();
				} catch (err) {
					reject(err instanceof Error ? err : new Error(String(err)));
				}
			});

			result = await watchPromise;
		} catch (e) {
			const error = e as Error;
			// 只有当错误明确是'aborted'时才忽略，否则抛出
			if (!error.message.includes('aborted')) {
				throw error;
			}
			// 当watch被主动中止时，尝试获取日志
			try {
				result = await this.getLogs(namespace, podName, 'main-container');
			} catch {
				// 如果无法获取日志，返回空字符串
				result = '';
			}
		} finally {
			try {
				await k8sCoreApi.deleteNamespacedPod({ name: podName, namespace });
			} catch (deleteerror) {
				// 忽略删除错误以防止掩盖原始错误
				console.error(`Failed to delete pod ${podName}:`, deleteerror);
			}
		}

		return result;
	}
}
