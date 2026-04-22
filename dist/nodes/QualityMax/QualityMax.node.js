"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QualityMax = void 0;
const n8n_workflow_1 = require("n8n-workflow");
async function qualityMaxRequest(ctx, method, path, body, qs) {
    const credentials = await ctx.getCredentials('qualityMaxApi');
    const options = {
        method,
        url: `${credentials.baseUrl}${path}`,
        headers: {
            Authorization: `Bearer ${credentials.apiToken}`,
            'Content-Type': 'application/json',
        },
        json: true,
        ...(body ? { body } : {}),
        ...(qs ? { qs } : {}),
    };
    return ctx.helpers.request(options);
}
class QualityMax {
    constructor() {
        this.description = {
            displayName: 'QualityMax',
            name: 'qualityMax',
            icon: 'file:qualitymax.svg',
            group: ['output'],
            version: 1,
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Interact with QualityMax — AI-native test automation platform',
            defaults: { name: 'QualityMax' },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [{ name: 'qualityMaxApi', required: true }],
            properties: [
                // ── Resource ──────────────────────────────────────────────────────────
                {
                    displayName: 'Resource',
                    name: 'resource',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        { name: 'Project', value: 'project' },
                        { name: 'Test Case', value: 'testCase' },
                        { name: 'Automation Script', value: 'script' },
                        { name: 'AI Crawl', value: 'aiCrawl' },
                        { name: 'k6 Performance', value: 'k6' },
                    ],
                    default: 'project',
                },
                // ── PROJECT operations ─────────────────────────────────────────────
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['project'] } },
                    options: [
                        { name: 'Get Many', value: 'getAll', description: 'List all projects', action: 'Get many projects' },
                        { name: 'Get', value: 'get', description: 'Get a project by ID', action: 'Get a project' },
                        { name: 'Create', value: 'create', description: 'Create a new project', action: 'Create a project' },
                        { name: 'Get Trends', value: 'getTrends', description: 'Get pipeline quality trends', action: 'Get project trends' },
                    ],
                    default: 'getAll',
                },
                // ── TEST CASE operations ───────────────────────────────────────────
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['testCase'] } },
                    options: [
                        { name: 'Get Many', value: 'getAll', action: 'Get many test cases' },
                        { name: 'Get', value: 'get', action: 'Get a test case' },
                        { name: 'Create', value: 'create', action: 'Create a test case' },
                        { name: 'Update', value: 'update', action: 'Update a test case' },
                        { name: 'Delete', value: 'delete', action: 'Delete a test case' },
                        { name: 'Generate Code', value: 'generateCode', action: 'Generate automation code for a test case' },
                        { name: 'Enhance with AI', value: 'enhance', action: 'AI-enhance a test case' },
                    ],
                    default: 'getAll',
                },
                // ── SCRIPT operations ──────────────────────────────────────────────
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['script'] } },
                    options: [
                        { name: 'Get Many', value: 'getAll', action: 'Get many scripts' },
                        { name: 'Execute', value: 'execute', action: 'Execute a script' },
                        { name: 'Get Results', value: 'getResults', action: 'Get execution results' },
                    ],
                    default: 'getAll',
                },
                // ── AI CRAWL operations ────────────────────────────────────────────
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['aiCrawl'] } },
                    options: [
                        { name: 'Start Crawl', value: 'start', action: 'Start an AI crawl' },
                        { name: 'Check Status', value: 'checkStatus', action: 'Check crawl status' },
                        { name: 'Get Results', value: 'getResults', action: 'Get crawl results and generated tests' },
                    ],
                    default: 'start',
                },
                // ── K6 operations ──────────────────────────────────────────────────
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['k6'] } },
                    options: [
                        { name: 'Get Many Scripts', value: 'getAll', action: 'Get many k6 scripts' },
                        { name: 'Run Test', value: 'run', action: 'Run a k6 performance test' },
                        { name: 'Check Status', value: 'checkStatus', action: 'Check k6 execution status' },
                        { name: 'Get Report', value: 'getReport', action: 'Get k6 execution report' },
                        { name: 'Pre-Deploy Gate', value: 'deployCheck', action: 'Run pre-deploy performance gate check' },
                    ],
                    default: 'run',
                },
                // ── SHARED FIELDS ──────────────────────────────────────────────────
                // Project ID (reused across resources)
                {
                    displayName: 'Project ID',
                    name: 'projectId',
                    type: 'string',
                    default: '',
                    required: true,
                    displayOptions: {
                        show: {
                            resource: ['project'],
                            operation: ['get', 'getTrends'],
                        },
                    },
                },
                {
                    displayName: 'Project ID',
                    name: 'projectId',
                    type: 'string',
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['testCase', 'script', 'aiCrawl'],
                            operation: ['getAll'],
                        },
                    },
                    description: 'Filter by project (optional)',
                },
                {
                    displayName: 'Project ID',
                    name: 'projectId',
                    type: 'string',
                    default: '',
                    required: true,
                    displayOptions: {
                        show: {
                            resource: ['testCase', 'aiCrawl'],
                            operation: ['create', 'start'],
                        },
                    },
                },
                {
                    displayName: 'Project ID',
                    name: 'projectId',
                    type: 'string',
                    default: '',
                    required: true,
                    displayOptions: {
                        show: {
                            resource: ['k6'],
                            operation: ['deployCheck'],
                        },
                    },
                },
                // Project name/description (create)
                {
                    displayName: 'Project Name',
                    name: 'projectName',
                    type: 'string',
                    default: '',
                    required: true,
                    displayOptions: { show: { resource: ['project'], operation: ['create'] } },
                },
                {
                    displayName: 'Project Description',
                    name: 'projectDescription',
                    type: 'string',
                    default: '',
                    displayOptions: { show: { resource: ['project'], operation: ['create'] } },
                },
                // Test Case ID
                {
                    displayName: 'Test Case ID',
                    name: 'testCaseId',
                    type: 'string',
                    default: '',
                    required: true,
                    displayOptions: {
                        show: {
                            resource: ['testCase'],
                            operation: ['get', 'update', 'delete', 'generateCode', 'enhance'],
                        },
                    },
                },
                // Test case fields
                {
                    displayName: 'Title',
                    name: 'title',
                    type: 'string',
                    default: '',
                    required: true,
                    displayOptions: { show: { resource: ['testCase'], operation: ['create'] } },
                },
                {
                    displayName: 'Description',
                    name: 'description',
                    type: 'string',
                    typeOptions: { rows: 4 },
                    default: '',
                    displayOptions: { show: { resource: ['testCase'], operation: ['create', 'update'] } },
                },
                {
                    displayName: 'Title',
                    name: 'title',
                    type: 'string',
                    default: '',
                    displayOptions: { show: { resource: ['testCase'], operation: ['update'] } },
                },
                {
                    displayName: 'Framework',
                    name: 'framework',
                    type: 'options',
                    options: [
                        { name: 'Playwright', value: 'playwright' },
                        { name: 'Cypress', value: 'cypress' },
                        { name: 'Selenium', value: 'selenium' },
                        { name: 'pytest', value: 'pytest' },
                        { name: 'k6', value: 'k6' },
                    ],
                    default: 'playwright',
                    displayOptions: { show: { resource: ['testCase'], operation: ['generateCode'] } },
                },
                // Script ID
                {
                    displayName: 'Script ID',
                    name: 'scriptId',
                    type: 'string',
                    default: '',
                    required: true,
                    displayOptions: {
                        show: {
                            resource: ['script'],
                            operation: ['execute', 'getResults'],
                        },
                    },
                },
                {
                    displayName: 'Execution ID',
                    name: 'executionId',
                    type: 'string',
                    default: '',
                    required: true,
                    displayOptions: {
                        show: {
                            resource: ['script'],
                            operation: ['getResults'],
                        },
                    },
                },
                // AI Crawl fields
                {
                    displayName: 'URL to Crawl',
                    name: 'crawlUrl',
                    type: 'string',
                    default: '',
                    required: true,
                    displayOptions: { show: { resource: ['aiCrawl'], operation: ['start'] } },
                    description: 'The live URL of the application to crawl',
                },
                {
                    displayName: 'Max Pages',
                    name: 'maxPages',
                    type: 'number',
                    default: 10,
                    displayOptions: { show: { resource: ['aiCrawl'], operation: ['start'] } },
                },
                {
                    displayName: 'Job ID',
                    name: 'jobId',
                    type: 'string',
                    default: '',
                    required: true,
                    displayOptions: {
                        show: {
                            resource: ['aiCrawl'],
                            operation: ['checkStatus', 'getResults'],
                        },
                    },
                },
                // k6 fields
                {
                    displayName: 'Script ID',
                    name: 'k6ScriptId',
                    type: 'string',
                    default: '',
                    required: true,
                    displayOptions: {
                        show: {
                            resource: ['k6'],
                            operation: ['run', 'getReport'],
                        },
                    },
                },
                {
                    displayName: 'Execution ID',
                    name: 'k6ExecutionId',
                    type: 'string',
                    default: '',
                    required: true,
                    displayOptions: {
                        show: {
                            resource: ['k6'],
                            operation: ['checkStatus', 'getReport'],
                        },
                    },
                },
                {
                    displayName: 'Report Format',
                    name: 'reportFormat',
                    type: 'options',
                    options: [
                        { name: 'JSON', value: 'json' },
                        { name: 'HTML', value: 'html' },
                    ],
                    default: 'json',
                    displayOptions: { show: { resource: ['k6'], operation: ['getReport'] } },
                },
                // Trends days
                {
                    displayName: 'Days',
                    name: 'days',
                    type: 'number',
                    default: 7,
                    displayOptions: { show: { resource: ['project'], operation: ['getTrends'] } },
                    description: 'Number of days of trend data to retrieve',
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            const resource = this.getNodeParameter('resource', i);
            const operation = this.getNodeParameter('operation', i);
            try {
                let responseData;
                // ── PROJECT ──────────────────────────────────────────────────────
                if (resource === 'project') {
                    if (operation === 'getAll') {
                        responseData = await qualityMaxRequest(this, 'GET', '/projects');
                    }
                    else if (operation === 'get') {
                        const id = this.getNodeParameter('projectId', i);
                        responseData = await qualityMaxRequest(this, 'GET', `/projects/${id}`);
                    }
                    else if (operation === 'create') {
                        responseData = await qualityMaxRequest(this, 'POST', '/projects', {
                            name: this.getNodeParameter('projectName', i),
                            description: this.getNodeParameter('projectDescription', i),
                        });
                    }
                    else if (operation === 'getTrends') {
                        const id = this.getNodeParameter('projectId', i);
                        const days = this.getNodeParameter('days', i);
                        responseData = await qualityMaxRequest(this, 'GET', `/projects/${id}/trends`, undefined, { days });
                    }
                    // ── TEST CASE ────────────────────────────────────────────────────
                }
                else if (resource === 'testCase') {
                    if (operation === 'getAll') {
                        const projectId = this.getNodeParameter('projectId', i, '');
                        responseData = await qualityMaxRequest(this, 'GET', '/test-cases', undefined, projectId ? { project_id: projectId } : undefined);
                    }
                    else if (operation === 'get') {
                        const id = this.getNodeParameter('testCaseId', i);
                        responseData = await qualityMaxRequest(this, 'GET', `/test-cases/${id}`);
                    }
                    else if (operation === 'create') {
                        responseData = await qualityMaxRequest(this, 'POST', '/test-cases', {
                            title: this.getNodeParameter('title', i),
                            description: this.getNodeParameter('description', i),
                            project_id: this.getNodeParameter('projectId', i),
                        });
                    }
                    else if (operation === 'update') {
                        const id = this.getNodeParameter('testCaseId', i);
                        const body = {};
                        const title = this.getNodeParameter('title', i, '');
                        const description = this.getNodeParameter('description', i, '');
                        if (title)
                            body.title = title;
                        if (description)
                            body.description = description;
                        responseData = await qualityMaxRequest(this, 'PUT', `/test-cases/${id}`, body);
                    }
                    else if (operation === 'delete') {
                        const id = this.getNodeParameter('testCaseId', i);
                        responseData = await qualityMaxRequest(this, 'DELETE', `/test-cases/${id}`);
                    }
                    else if (operation === 'generateCode') {
                        const id = this.getNodeParameter('testCaseId', i);
                        responseData = await qualityMaxRequest(this, 'POST', `/test-cases/${id}/generate-code`, {
                            framework: this.getNodeParameter('framework', i),
                        });
                    }
                    else if (operation === 'enhance') {
                        const id = this.getNodeParameter('testCaseId', i);
                        responseData = await qualityMaxRequest(this, 'POST', `/test-cases/${id}/enhance`);
                    }
                    // ── SCRIPT ───────────────────────────────────────────────────────
                }
                else if (resource === 'script') {
                    if (operation === 'getAll') {
                        const projectId = this.getNodeParameter('projectId', i, '');
                        responseData = await qualityMaxRequest(this, 'GET', '/automation/scripts', undefined, projectId ? { project_id: projectId } : undefined);
                    }
                    else if (operation === 'execute') {
                        const scriptId = this.getNodeParameter('scriptId', i);
                        responseData = await qualityMaxRequest(this, 'POST', '/automation/execute', {
                            script_id: scriptId,
                        });
                    }
                    else if (operation === 'getResults') {
                        const executionId = this.getNodeParameter('executionId', i);
                        responseData = await qualityMaxRequest(this, 'GET', '/automation/results', undefined, {
                            execution_id: executionId,
                        });
                    }
                    // ── AI CRAWL ─────────────────────────────────────────────────────
                }
                else if (resource === 'aiCrawl') {
                    if (operation === 'start') {
                        responseData = await qualityMaxRequest(this, 'POST', '/ai-crawl/start', {
                            project_id: this.getNodeParameter('projectId', i),
                            url: this.getNodeParameter('crawlUrl', i),
                            max_pages: this.getNodeParameter('maxPages', i),
                        });
                    }
                    else if (operation === 'checkStatus') {
                        const jobId = this.getNodeParameter('jobId', i);
                        responseData = await qualityMaxRequest(this, 'GET', `/ai-crawl/status/${jobId}`);
                    }
                    else if (operation === 'getResults') {
                        const jobId = this.getNodeParameter('jobId', i);
                        responseData = await qualityMaxRequest(this, 'GET', `/ai-crawl/results/${jobId}`);
                    }
                    // ── K6 ───────────────────────────────────────────────────────────
                }
                else if (resource === 'k6') {
                    if (operation === 'getAll') {
                        responseData = await qualityMaxRequest(this, 'GET', '/k6/scripts');
                    }
                    else if (operation === 'run') {
                        const scriptId = this.getNodeParameter('k6ScriptId', i);
                        responseData = await qualityMaxRequest(this, 'POST', `/k6/run/${scriptId}`);
                    }
                    else if (operation === 'checkStatus') {
                        const execId = this.getNodeParameter('k6ExecutionId', i);
                        responseData = await qualityMaxRequest(this, 'GET', `/k6/status/${execId}`);
                    }
                    else if (operation === 'getReport') {
                        const execId = this.getNodeParameter('k6ExecutionId', i);
                        const format = this.getNodeParameter('reportFormat', i);
                        responseData = await qualityMaxRequest(this, 'GET', `/k6/executions/${execId}/report`, undefined, { format });
                    }
                    else if (operation === 'deployCheck') {
                        const projectId = this.getNodeParameter('projectId', i);
                        responseData = await qualityMaxRequest(this, 'POST', `/k6/deploy-check/${projectId}`);
                    }
                }
                const executionData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(responseData), { itemData: { item: i } });
                returnData.push(...executionData);
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: error.message }, pairedItem: { item: i } });
                    continue;
                }
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), error, { itemIndex: i });
            }
        }
        return [returnData];
    }
}
exports.QualityMax = QualityMax;
