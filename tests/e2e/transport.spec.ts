import { test, expect } from '@playwright/test';
import { FatturaFacileMcpServer } from '../../src/server/mcp-server.js';

test.describe('MCP Transport & HTTP/SSE Protocol Endpoints', () => {
  let server: FatturaFacileMcpServer;

  test.beforeAll(async () => {
    process.env.MCP_TRANSPORT = 'streamable-http';
    process.env.PORT = '3001';
    server = new FatturaFacileMcpServer();
    await server.start();
  });

  test.afterAll(async () => {
    if (server) {
      await server.stop();
    }
  });

  test('health check endpoint responds with status healthy', async ({ request }) => {
    const response = await request.get('http://127.0.0.1:3001/health');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.version).toBe('1.0.0');
  });

  test('messages endpoint returns bad request when no active SSE connection is open', async ({
    request,
  }) => {
    const response = await request.post('http://127.0.0.1:3001/messages', {
      data: {
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
      },
    });
    expect(response.status()).toBe(400);
  });
});
