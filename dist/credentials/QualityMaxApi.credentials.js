"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QualityMaxApi = void 0;
class QualityMaxApi {
    constructor() {
        this.name = 'qualityMaxApi';
        this.displayName = 'QualityMax API';
        this.documentationUrl = 'https://docs.qualitymax.io/api';
        this.properties = [
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
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    Authorization: '=Bearer {{$credentials.apiToken}}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: '={{$credentials.baseUrl}}',
                url: '/projects',
                method: 'GET',
            },
        };
    }
}
exports.QualityMaxApi = QualityMaxApi;
