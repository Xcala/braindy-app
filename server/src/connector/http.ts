// Remote Braindy connector: MCP over Streamable HTTP at /mcp, stateless (one server per request), behind OAuth.
import { Hono } from 'hono';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { registerTools } from './tools.js';
import { API, tokenUser } from './oauth.js';

export const mcp = new Hono();

mcp.all('/mcp', async (c) => {
  const uid = await tokenUser(c.req.header('authorization'));
  if (!uid) {
    c.header('WWW-Authenticate', `Bearer resource_metadata="${API}/.well-known/oauth-protected-resource"`);
    return c.json({ error: 'unauthorized' }, 401);
  }
  const server = new McpServer({ name: 'braindy-app', version: '2.0.0' });
  registerTools(server, { mode: 'remote', uid });
  // Files can travel inside the message (base64), so the body limit sits just under Cloud Run's 32 MB.
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true, maxRequestBodySize: 30 * 1024 ** 2 });
  await server.connect(transport);
  return transport.handleRequest(c.req.raw);
});
