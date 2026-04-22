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
		const lastChecked = (workflowStaticData.lastChecked as string)
			?? new Date(now.getTime() - 60_000).toISOString();
		workflowStaticData.lastChecked = now.toISOString();
		const lastCheckedDate = new Date(lastChecked);

		let results: IDataObject[] = [];

		try {
			if (triggerOn === 'executionCompleted') {
				const qs: Record<string, string | number | boolean> = {
					limit: 50,
					...(projectId ? { project_id: projectId } : {}),
				};
				const response = await qualityMaxRequest(this, '/api/automation/results', qs) as IDataObject;
				const items = (response.results ?? response.data ?? response ?? []) as IDataObject[];

				results = items.filter((item: IDataObject) => {
					const createdAt = item.created_at as string | undefined;
					if (!createdAt || new Date(createdAt) <= lastCheckedDate) return false;
					if (statusFilter === 'failed') return item.status === 'failed' || item.passed === false;
					if (statusFilter === 'passed') return item.status === 'passed' || item.passed === true;
					return true;
				});

			} else if (triggerOn === 'k6Completed') {
				const qs = projectId ? { project_id: projectId } : undefined;
				const scriptsResponse = await qualityMaxRequest(this, '/api/k6/scripts', qs) as IDataObject;
				const scripts = (scriptsResponse.scripts ?? scriptsResponse ?? []) as IDataObject[];

				for (const script of scripts) {
					if (!script.last_execution_id) continue;
					try {
						const execResponse = await qualityMaxRequest(
							this,
							`/api/k6/status/${script.last_execution_id}`,
						) as IDataObject;
						const completedAt = execResponse.completed_at as string | undefined;
						if (
							execResponse.status === 'completed' &&
							completedAt &&
							new Date(completedAt) > lastCheckedDate
						) {
							if (statusFilter === 'failed' && execResponse.passed) continue;
							if (statusFilter === 'passed' && !execResponse.passed) continue;
							results.push({ script, execution: execResponse });
						}
					} catch {
						// skip scripts whose last execution can't be fetched
					}
				}

			} else if (triggerOn === 'crawlCompleted') {
				const qs = projectId ? { project_id: projectId } : undefined;
				const response = await qualityMaxRequest(this, '/api/ai-crawl/jobs', qs) as IDataObject;
				const jobs = (response.jobs ?? response.data ?? response ?? []) as IDataObject[];
				results = jobs.filter((job: IDataObject) => {
					const completedAt = job.completed_at as string | undefined;
					return (
						job.status === 'completed' &&
						completedAt &&
						new Date(completedAt) > lastCheckedDate
					);
				});
			}
		} catch {
			return null;
		}

		if (!results.length) return null;
		return [results.map((item) => ({ json: item }))];
	}
}
