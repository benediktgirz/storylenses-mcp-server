# StoryLenses MCP Server

AI-powered cover letter generation for MCP-compatible agents. The first production MCP server for job applications.

## Tools

| Tool | Description |
|------|-------------|
| `storylenses_analyze_job` | Extract 15+ structured fields from a job posting |
| `storylenses_match_profile` | Match a candidate CV against job data |
| `storylenses_generate_letter` | Generate a story-driven cover letter |
| `storylenses_quality_check` | Score and evaluate a cover letter |
| `storylenses_list_archetypes` | List available narrative archetypes and tones |

## Setup

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "storylenses": {
      "command": "npx",
      "args": ["-y", "@storylenses/mcp-server"],
      "env": {
        "STORYLENSES_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Cursor / VS Code

Add to `.cursor/mcp.json` or VS Code MCP settings:

```json
{
  "mcp": {
    "servers": {
      "storylenses": {
        "command": "npx",
        "args": ["-y", "@storylenses/mcp-server"],
        "env": {
          "STORYLENSES_API_KEY": "your-api-key"
        }
      }
    }
  }
}
```

### Docker

```bash
docker run -e STORYLENSES_API_KEY=your-key ghcr.io/benediktgirz/storylenses-mcp-server
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STORYLENSES_API_KEY` | Yes | Your API key from storylenses.app/mcp |
| `STORYLENSES_API_URL` | No | API base URL (default: https://www.storylenses.app) |

## Example Workflow

```typescript
// 1. Analyze job posting
const job = await callTool("storylenses_analyze_job", {
  job_url: "https://linkedin.com/jobs/view/12345"
});

// 2. Match candidate profile
const match = await callTool("storylenses_match_profile", {
  job_analysis: job,
  candidate_cv: "Senior engineer with 7 years React experience..."
});

// 3. Generate cover letter
const letter = await callTool("storylenses_generate_letter", {
  job_analysis: job,
  match_data: match,
  candidate_name: "Alex Chen",
  archetype: match.suggestedArchetype
});

// 4. Quality check
const score = await callTool("storylenses_quality_check", {
  letter_text: letter.letter_text,
  job_analysis: job
});
```

## Testing

```bash
npm install
STORYLENSES_API_KEY=your-key npm test
```

## Get an API Key

Visit [storylenses.app/mcp](https://www.storylenses.app/mcp) to get your API key.

- Free: 10 generations/month
- Developer ($29/mo): 200 generations
- Scale ($99/mo): 1,000 generations

## License

MIT
