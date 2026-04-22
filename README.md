# n8n-nodes-qualitymax

[QualityMax](https://qualitymax.io) community node for [n8n](https://n8n.io) — connect AI-native test automation into any workflow.

## What you can do

| Resource | Operations |
|---|---|
| **Project** | Get Many, Get, Create, Get Trends |
| **Test Case** | Get Many, Get, Create, Update, Delete, Generate Code, AI Enhance |
| **Automation Script** | Get Many, Execute, Get Results |
| **AI Crawl** | Start, Check Status, Get Results |
| **k6 Performance** | Get Many Scripts, Run Test, Check Status, Get Report, Pre-Deploy Gate |

Plus a **QualityMax Trigger** node that fires on:
- Test execution completed (pass/fail filter)
- k6 run completed
- AI crawl completed

## Hero workflow

**GitHub PR merged → regression suite → Slack report**

Import `demo-workflows/github-pr-regression-to-slack.json` into n8n. Set three env vars:

```
QM_BASE_URL=https://app.qualitymax.io
QM_REGRESSION_SCRIPT_ID=<your script id>
SLACK_CHANNEL=#qa-alerts
```

The workflow:
1. Fires on every PR merged to `main`
2. Posts "regression starting" to Slack
3. Executes your QualityMax regression script
4. Polls every 30s until complete (up to 10 min)
5. Posts pass ✅ or fail ❌ to Slack with test counts + report link

## Installation

### In n8n Cloud / self-hosted

1. Go to **Settings → Community Nodes → Install**
2. Enter `n8n-nodes-qualitymax`
3. Click Install

### Local dev

```bash
npm install
npm run build
# symlink into your n8n custom extensions dir
```

## Credentials

Generate an API token at **qualitymax.io/settings → API Tokens**. Tokens start with `qm-`. Add it as a **QualityMax API** credential in n8n.

## License

MIT
