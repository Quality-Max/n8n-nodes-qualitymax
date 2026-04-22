"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QualityMaxTrigger = void 0;
async function qualityMaxRequest(ctx, path, qs) {
    const credentials = await ctx.getCredentials('qualityMaxApi');
    const options = {
        method: 'GET',
        url: `${credentials.baseUrl}${path}`,
        headers: {
            Authorization: `Bearer ${credentials.apiToken}`,
            'Content-Type': 'application/json',
        },
        json: true,
        ...(qs ? { qs } : {}),
    };
    return ctx.helpers.request(options);
}
class QualityMaxTrigger {
    constructor() {
        this.description = {
            displayName: 'QualityMax Trigger',
            name: 'qualityMaxTrigger',
            icon: 'file:qualitymax.svg',
            group: ['trigger'],
            version: 1,
            description: 'Triggers when a QualityMax test execution completes',
            defaults: { name: 'QualityMax Trigger' },
            inputs: [],
            outputs: ['main'],
            credentials: [{ name: 'qualityMaxApi', required: true }],
            polling: true,
            properties: [
                {
                    displayName: 'Trigger On',
                    name: 'triggerOn',
                    type: 'options',
                    options: [
                        {
                            name: 'Test Execution Completed',
                            value: 'executionCompleted',
                            description: 'Fires when a Playwright/Cypress/etc. script finishes',
                        },
                        {
                            name: 'k6 Run Completed',
                            value: 'k6Completed',
                            description: 'Fires when a k6 performance test finishes',
                        },
                        {
                            name: 'AI Crawl Completed',
                            value: 'crawlCompleted',
                            description: 'Fires when an AI crawl job finishes',
                        },
                    ],
                    default: 'executionCompleted',
                },
                {
                    displayName: 'Project ID',
                    name: 'projectId',
                    type: 'string',
                    default: '',
                    description: 'Only trigger for this project (leave blank for all projects)',
                },
                {
                    displayName: 'Status Filter',
                    name: 'statusFilter',
                    type: 'options',
                    options: [
                        { name: 'Any (passed or failed)', value: 'any' },
                        { name: 'Failed only', value: 'failed' },
                        { name: 'Passed only', value: 'passed' },
                    ],
                    default: 'any',
                    displayOptions: { show: { triggerOn: ['executionCompleted', 'k6Completed'] } },
                },
            ],
        };
    }
    async poll() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const triggerOn = this.getNodeParameter('triggerOn');
        const projectId = this.getNodeParameter('projectId', '');
        const statusFilter = this.getNodeParameter('statusFilter', 'any');
        const now = new Date();
        const workflowStaticData = this.getWorkflowStaticData('node');
        // Track the last checked timestamp to avoid re-emitting items
        const lastChecked = (_a = workflowStaticData.lastChecked) !== null && _a !== void 0 ? _a : new Date(now.getTime() - 60000).toISOString();
        workflowStaticData.lastChecked = now.toISOString();
        let path = '';
        let results = [];
        try {
            if (triggerOn === 'executionCompleted') {
                const qs = {
                    completed_after: lastChecked,
                    ...(projectId ? { project_id: projectId } : {}),
                };
                const response = await qualityMaxRequest(this, '/automation/results', qs);
                const items = ((_d = (_c = (_b = response.results) !== null && _b !== void 0 ? _b : response.data) !== null && _c !== void 0 ? _c : response) !== null && _d !== void 0 ? _d : []);
                results = items.filter((item) => {
                    if (statusFilter === 'failed')
                        return item.status === 'failed' || item.passed === false;
                    if (statusFilter === 'passed')
                        return item.status === 'passed' || item.passed === true;
                    return true;
                });
            }
            else if (triggerOn === 'k6Completed') {
                path = '/k6/scripts';
                const scriptsResponse = await qualityMaxRequest(this, path, projectId ? { project_id: projectId } : undefined);
                const scripts = ((_f = (_e = scriptsResponse.scripts) !== null && _e !== void 0 ? _e : scriptsResponse) !== null && _f !== void 0 ? _f : []);
                for (const script of scripts) {
                    const execResponse = await qualityMaxRequest(this, `/k6/status/${script.last_execution_id}`);
                    if (execResponse.status === 'completed' &&
                        new Date(execResponse.completed_at) > new Date(lastChecked)) {
                        if (statusFilter === 'failed' && execResponse.passed)
                            continue;
                        if (statusFilter === 'passed' && !execResponse.passed)
                            continue;
                        results.push({ script, execution: execResponse });
                    }
                }
            }
            else if (triggerOn === 'crawlCompleted') {
                const qs = projectId ? { project_id: projectId } : undefined;
                const response = await qualityMaxRequest(this, '/ai-crawl/jobs', qs);
                const jobs = ((_j = (_h = (_g = response.jobs) !== null && _g !== void 0 ? _g : response.data) !== null && _h !== void 0 ? _h : response) !== null && _j !== void 0 ? _j : []);
                results = jobs.filter((job) => {
                    return (job.status === 'completed' &&
                        new Date(job.completed_at) > new Date(lastChecked));
                });
            }
        }
        catch {
            // Return null to signal no new data rather than crashing the trigger
            return null;
        }
        if (!results.length)
            return null;
        return [results.map((item) => ({ json: item }))];
    }
}
exports.QualityMaxTrigger = QualityMaxTrigger;
