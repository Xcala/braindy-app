// Braindy connector (local, stdio): lets any Claude session on Nicolas's PC write into Braindy App.
// Same tools as the remote connector (src/connector/tools.ts); here files are paths on disk and the identity is his gcloud login.
// Installed once: claude mcp add --scope user braindy-app -- node <repo>/node_modules/tsx/dist/cli.mjs <repo>/server/mcp/index.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from '../src/connector/tools.js';

const server = new McpServer({ name: 'braindy-app', version: '2.0.0' });
registerTools(server, { mode: 'local', uid: process.env.BRAINDY_UID ?? 'connector' });
await server.connect(new StdioServerTransport());
