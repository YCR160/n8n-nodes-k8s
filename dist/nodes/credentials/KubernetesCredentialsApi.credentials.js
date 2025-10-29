"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KubernetesCredentialsApi = void 0;
class KubernetesCredentialsApi {
    constructor() {
        this.name = 'kubernetesCredentialsApi';
        this.displayName = 'Kubernetes Credentials';
        this.documentationUrl = 'https://github.com/kubernetes-client/javascript';
        this.icon = 'file:../Kubernetes/k8s.svg';
        this.genericAuth = false;
        this.properties = [
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
        this.authenticate = {
            type: 'generic',
            properties: {},
        };
    }
}
exports.KubernetesCredentialsApi = KubernetesCredentialsApi;
//# sourceMappingURL=KubernetesCredentialsApi.credentials.js.map