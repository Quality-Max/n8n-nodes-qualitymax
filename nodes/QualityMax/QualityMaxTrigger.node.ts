import {
	IPollFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IRequestOptions,
} from 'n8n-workflow';

async function qualityMaxRequest(
	ctx: IPollFunctions,
	path: string,
	qs?: Record<string, string | number | boolean>,
): Promise<unknown> {
	const credentials = await ctx.getCredentials('qualityMaxApi');
	const options: IRequestOptions = {
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

export class QualityMaxTrigger implements INodeType {
	description: INodeTypeDescription = {
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

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const triggerOn = this.getNodeParameter('triggerOn') as string;
		const projectId = this.getNodeParameter('projectId', '') as string;
		const statusFilter = this.getNodeParameter('statusFilter', 'any') as string;

		const now = new Date();
		const workflowStaticData = this.getWorkflowStaticData('node');

		// Track the last checked timestamp to avoid re-emitting items
		const lastChecked = (workflowStaticData.lastChecked as string) ?? new Date(now.getTime() - 60_000).toISOString();
		workflowStaticData.lastChecked = now.toISOString();

		let path = '';
		let results: IDataObject[] = [];

		try {
			if (triggerOn === 'executionCompleted') {
				const qs: Record<string, string | number | boolean> = {
					completed_after: lastChecked,
					...(projectId ? { project_id: projectId } : {}),
				};
				const response = await qualityMaxRequest(this, '/automation/results', qs) as IDataObject;
				const items = (response.results ?? response.data ?? response ?? []) as IDataObject[];
				results = items.filter((item: IDataObject) => {
					if (statusFilter === 'failed') return item.status === 'failed' || item.passed === false;
					if (statusFilter === 'passed') return item.status === 'passed' || item.passed === true;
					return true;
				});

			} else if (triggerOn === 'k6Completed') {
				path = '/k6/scripts';
				const scriptsResponse = await qualityMaxRequest(this, path, projectId ? { project_id: projectId } : undefined) as IDataObject;
				const scripts = (scriptsResponse.scripts ?? scriptsResponse ?? []) as IDataObject[];

				for (const script of scripts) {
					const execResponse = await qualityMaxRequest(
						this,
						`/k6/status/${script.last_execution_id}`,
					) as IDataObject;
					if (
						execResponse.status === 'completed' &&
						new Date(execResponse.completed_at as string) > new Date(lastChecked)
					) {
						if (statusFilter === 'failed' && execResponse.passed) continue;
						if (statusFilter === 'passed' && !execResponse.passed) continue;
						results.push({ script, execution: execResponse });
					}
				}

			} else if (triggerOn === 'crawlCompleted') {
				const qs = projectId ? { project_id: projectId } : undefined;
				const response = await qualityMaxRequest(this, '/ai-crawl/jobs', qs) as IDataObject;
				const jobs = (response.jobs ?? response.data ?? response ?? []) as IDataObject[];
				results = jobs.filter((job: IDataObject) => {
					return (
						job.status === 'completed' &&
						new Date(job.completed_at as string) > new Date(lastChecked)
					);
				});
			}
		} catch {
			// Return null to signal no new data rather than crashing the trigger
			return null;
		}

		if (!results.length) return null;

		return [results.map((item) => ({ json: item }))];
	}
}
