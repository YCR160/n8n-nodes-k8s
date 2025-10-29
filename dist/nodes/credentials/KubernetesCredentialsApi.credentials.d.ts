import { ICredentialType, INodeProperties, IAuthenticateGeneric, Icon } from 'n8n-workflow';
export declare class KubernetesCredentialsApi implements ICredentialType {
    name: string;
    displayName: string;
    documentationUrl: string;
    icon: Icon;
    genericAuth: boolean;
    properties: INodeProperties[];
    authenticate: IAuthenticateGeneric;
    test: undefined;
}
