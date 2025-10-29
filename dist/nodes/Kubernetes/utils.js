"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.K8SClient = void 0;
const node_stream_1 = require("node:stream");
const k8s = __importStar(require("@kubernetes/client-node"));
const n8n_workflow_1 = require("n8n-workflow");
n8n_workflow_1.LoggerProxy.init(console);
class K8SClient {
    constructor(credentials) {
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
    async listNamespace() {
        const k8sCoreApi = this.kubeConfig.makeApiClient(k8s.CoreV1Api);
        const resp = await k8sCoreApi.listNamespace();
        return resp.items;
    }
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
    async getResource(namespace, resource, resourceName) {
        const k8sAppsApi = this.kubeConfig.makeApiClient(k8s.AppsV1Api);
        const k8sBatchApi = this.kubeConfig.makeApiClient(k8s.BatchV1Api);
        const k8sCoreApi = this.kubeConfig.makeApiClient(k8s.CoreV1Api);
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
    async deleteResource(namespace, resource, resourceName) {
        const k8sAppsApi = this.kubeConfig.makeApiClient(k8s.AppsV1Api);
        const k8sBatchApi = this.kubeConfig.makeApiClient(k8s.BatchV1Api);
        const k8sCoreApi = this.kubeConfig.makeApiClient(k8s.CoreV1Api);
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
    async getLogs(namespace, podName, containerName = 'main-container') {
        const k8sCoreApi = this.kubeConfig.makeApiClient(k8s.CoreV1Api);
        try {
            const logs = await k8sCoreApi.readNamespacedPodLog({
                name: podName,
                namespace,
                container: containerName,
            });
            return logs;
        }
        catch (error) {
            throw new Error(`Failed to get logs: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async scaleResource(namespace, resource, resourceName, replicas) {
        const k8sAppsApi = this.kubeConfig.makeApiClient(k8s.AppsV1Api);
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
                return await k8sAppsApi.patchNamespacedDaemonSet({
                    name: resourceName,
                    namespace,
                    body: scaleBody,
                });
            default:
                throw new Error(`Scaling not supported for resource type: ${resource}`);
        }
    }
    async patchResource(namespace, resource, resourceName, patchData) {
        const k8sAppsApi = this.kubeConfig.makeApiClient(k8s.AppsV1Api);
        const k8sBatchApi = this.kubeConfig.makeApiClient(k8s.BatchV1Api);
        const k8sCoreApi = this.kubeConfig.makeApiClient(k8s.CoreV1Api);
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
    async execCommand(namespace, podName, containerName, command) {
        const k8sExec = new k8s.Exec(this.kubeConfig);
        return new Promise((resolve, reject) => {
            let output = '';
            k8sExec.exec(namespace, podName, containerName, command, new node_stream_1.Writable({
                write(chunk, encoding, callback) {
                    output += chunk.toString();
                    callback();
                },
            }), new node_stream_1.Writable({
                write(chunk, encoding, callback) {
                    output += chunk.toString();
                    callback();
                },
            }), null, true, (err) => {
                if (err) {
                    reject(new Error(`Exec command failed: ${err.message}`));
                }
                else {
                    resolve(output);
                }
            });
        });
    }
    async restartResource(namespace, resource, resourceName) {
        const k8sAppsApi = this.kubeConfig.makeApiClient(k8s.AppsV1Api);
        const normalizedResource = resource.replace(/s$/, '');
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
    async portForward(namespace, podName) {
        var _a, _b, _c, _d;
        const k8sCoreV1Api = this.kubeConfig.makeApiClient(k8s.CoreV1Api);
        const pod = await k8sCoreV1Api.readNamespacedPod({ name: podName, namespace });
        if ((_d = (_c = (_b = (_a = pod.spec) === null || _a === void 0 ? void 0 : _a.containers) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.ports) === null || _d === void 0 ? void 0 : _d[0]) {
            const remotePort = pod.spec.containers[0].ports[0].containerPort;
            return {
                localPort: remotePort,
                remotePort: remotePort,
            };
        }
        throw new Error('No ports found on pod');
    }
    static async listPod(kubeConfig, namespace = 'default') {
        const k8sCoreApi = kubeConfig.makeApiClient(k8s.CoreV1Api);
        return await k8sCoreApi.listNamespacedPod({ namespace });
    }
    async runPodAndGetOutput(image, args, env, podName, namespace = 'default') {
        const kc = this.kubeConfig;
        const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
        const watch = new k8s.Watch(kc);
        podName = podName || `n8n-pod-${Date.now()}`;
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
        };
        await k8sCoreApi.createNamespacedPod({ namespace, body: podSpec });
        let result = '';
        try {
            let watchReq = null;
            n8n_workflow_1.LoggerProxy.debug(`created pod ${podName} in ${namespace}.`);
            const watchPromise = new Promise((resolve, reject) => {
                try {
                    (async () => {
                        watchReq = await watch.watch(`/api/v1/namespaces/${namespace}/pods`, {}, async (phase, apiObj, obj) => {
                            var _a, _b;
                            n8n_workflow_1.LoggerProxy.debug(`watch pods phase: ${phase}, pod: ${JSON.stringify(obj)}`, {
                                obj,
                                apiObj,
                            });
                            if (((_a = apiObj.metadata) === null || _a === void 0 ? void 0 : _a.name) !== podName) {
                                return;
                            }
                            const status = (_b = apiObj.status) === null || _b === void 0 ? void 0 : _b.phase;
                            if (status === 'Succeeded' || status === 'Failed') {
                                try {
                                    const logsResponse = await k8sCoreApi.readNamespacedPodLog({
                                        name: podName,
                                        namespace,
                                        container: 'main-container',
                                    });
                                    resolve(logsResponse);
                                    if (watchReq) {
                                        watchReq.abort();
                                    }
                                }
                                catch (err) {
                                    if (watchReq) {
                                        watchReq.abort();
                                    }
                                    reject(new Error(`Failed to get logs: ${err instanceof Error ? err.message : String(err)}`));
                                }
                            }
                        }, (err) => {
                            console.error('watch pods error', err);
                            if (watchReq) {
                                watchReq.abort();
                            }
                            reject(err);
                        });
                    })();
                }
                catch (err) {
                    reject(err instanceof Error ? err : new Error(String(err)));
                }
            });
            result = await watchPromise;
        }
        catch (e) {
            const error = e;
            if (!error.message.includes('aborted')) {
                throw error;
            }
            try {
                result = await this.getLogs(namespace, podName, 'main-container');
            }
            catch {
                result = '';
            }
        }
        finally {
            try {
                await k8sCoreApi.deleteNamespacedPod({ name: podName, namespace });
            }
            catch (deleteerror) {
                console.error(`Failed to delete pod ${podName}:`, deleteerror);
            }
        }
        return result;
    }
}
exports.K8SClient = K8SClient;
//# sourceMappingURL=utils.js.map