import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { McpTransportType } from '../types/mcp.js';
import { config } from '../config/environment.js';

export interface TransportInstance {
  type: McpTransportType;
  start(): Promise<void>;
  close(): Promise<void>;
}

export class TransportFactory {
  public static createTransport(
    server: Server,
    transportType: McpTransportType = config.MCP_TRANSPORT,
  ): TransportInstance {
    if (transportType === 'stdio') {
      const stdioTransport = new StdioServerTransport();
      return {
        type: 'stdio',
        start: async () => {
          await server.connect(stdioTransport);
        },
        close: async () => {
          await stdioTransport.close();
        },
      };
    }

    if (transportType === 'streamable-http' || transportType === 'sse') {
      const app = express();
      app.use(cors());
      app.use(express.json());

      let sseTransport: SSEServerTransport | null = null;
      let httpServer: ReturnType<typeof app.listen> | null = null;

      // SSE endpoint for legacy compatibility & streaming
      app.get('/sse', async (_req: Request, res: Response) => {
        sseTransport = new SSEServerTransport('/messages', res);
        await server.connect(sseTransport);
      });

      // Message post endpoint
      app.post('/messages', async (req: Request, res: Response) => {
        if (!sseTransport) {
          res.status(400).send('No active SSE connection');
          return;
        }
        await sseTransport.handlePostMessage(req, res);
      });

      // Health check endpoint
      app.get('/health', (_req: Request, res: Response) => {
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          transport: transportType,
          version: '1.0.0',
        });
      });

      return {
        type: transportType,
        start: async () => {
          await new Promise<void>((resolve) => {
            httpServer = app.listen(config.PORT, config.HOST, () => {
              resolve();
            });
          });
        },
        close: async () => {
          if (httpServer) {
            await new Promise<void>((resolve) => httpServer?.close(() => resolve()));
          }
        },
      };
    }

    throw new Error(`Unsupported transport type: ${String(transportType)}`);
  }
}
