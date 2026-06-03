import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const SERVER_URL = '/mcp';

let mcpClient = null;

export const initMcpClient = async () => {
  if (mcpClient) return mcpClient;

  mcpClient = new Client(
    { name: 'react-mcp-client', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  const transport = new StreamableHTTPClientTransport(
    new URL(SERVER_URL, window.location.origin)
  );
  await mcpClient.connect(transport);
  return mcpClient;
};

export const getMcpClient = () => mcpClient;

export default { initMcpClient, getMcpClient };
