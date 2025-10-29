import * as k8s from '@kubernetes/client-node';
import { ICredentialDataDecryptedObject } from 'n8n-workflow';
export declare class K8SClient {
    private kubeConfig;
    constructor(credentials: ICredentialDataDecryptedObject);
    listNamespace(): Promise<k8s.V1Namespace[]>;
    listWorkload(namespace?: string, resource?: string): Promise<k8s.V1Deployment[] | k8s.V1StatefulSet[] | k8s.V1DaemonSet[] | k8s.V1CronJob[] | k8s.V1Job[] | k8s.V1Pod[] | k8s.V1Service[] | k8s.V1ConfigMap[] | k8s.V1Secret[] | k8s.V1Role[] | k8s.V1RoleBinding[] | k8s.V1ServiceAccount[]>;
    getResource(namespace: string, resource: string, resourceName: string): Promise<k8s.V1Namespace | k8s.V1Deployment | k8s.V1StatefulSet | k8s.V1DaemonSet | k8s.V1CronJob | k8s.V1Job | k8s.V1Pod | k8s.V1Service>;
    deleteResource(namespace: string, resource: string, resourceName: string): Promise<k8s.V1Pod | k8s.V1Service | k8s.V1Status>;
    getLogs(namespace: string, podName: string, containerName?: string): Promise<string>;
    scaleResource(namespace: string, resource: string, resourceName: string, replicas: number): Promise<k8s.V1DaemonSet | k8s.V1Scale>;
    patchResource(namespace: string, resource: string, resourceName: string, patchData: unknown): Promise<k8s.V1Deployment | k8s.V1StatefulSet | k8s.V1DaemonSet | k8s.V1CronJob | k8s.V1Job | k8s.V1Pod | k8s.V1Service>;
    execCommand(namespace: string, podName: string, containerName: string, command: string[]): Promise<string>;
    restartResource(namespace: string, resource: string, resourceName: string): Promise<k8s.V1Deployment | k8s.V1StatefulSet | k8s.V1DaemonSet>;
    portForward(namespace: string, podName: string): Promise<{
        localPort: number;
        remotePort: number;
    }>;
    static listPod(kubeConfig: k8s.KubeConfig, namespace?: string): Promise<k8s.V1PodList>;
    runPodAndGetOutput(image: string, args: string[], env: string[], podName?: string, namespace?: string): Promise<string>;
}
