import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { getAllTools, BaseTool } from '../tools/index.js';
import { getAllResources, BaseResource } from '../resources/index.js';
import { getAllPrompts, BasePrompt } from '../prompts/index.js';
import { Authenticator } from '../auth/authenticator.js';
import { TransportFactory, TransportInstance } from '../transport/factory.js';
import { config } from '../config/environment.js';
import { auditLogger } from '../audit/logger.js';

export class FatturaFacileMcpServer {
  private readonly server: Server;
  private readonly tools = new Map<string, BaseTool<any, any>>();
  private readonly resources = new Map<string, BaseResource<any>>();
  private readonly prompts = new Map<string, BasePrompt<any>>();
  private transportInstance: TransportInstance | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'fatturafacile-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      },
    );

    this.registerCapabilities();
    this.setupHandlers();
  }

  private registerCapabilities(): void {
    for (const tool of getAllTools()) {
      this.tools.set(tool.metadata.name, tool);
    }

    for (const resource of getAllResources()) {
      this.resources.set(resource.metadata.uri, resource);
    }

    for (const prompt of getAllPrompts()) {
      this.prompts.set(prompt.metadata.name, prompt);
    }
  }

  private setupHandlers(): void {
    // 1. List Tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const toolList = Array.from(this.tools.values()).map((tool) => ({
        name: tool.metadata.name,
        description: tool.metadata.description,
        inputSchema: {
          type: 'object',
          properties: {}, // Schemas validated by Zod inside Tool Framework
        },
      }));
      return { tools: toolList };
    });

    // 2. Call Tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const tool = this.tools.get(toolName);

      if (!tool) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: `Tool '${toolName}' not found`,
              }),
            },
          ],
          isError: true,
        };
      }

      // Resolve multi-tenant execution context
      const context = await Authenticator.resolveContext({});
      const result = await tool.execute(request.params.arguments, context);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result.success ? result.data : result.error, null, 2),
          },
        ],
        isError: !result.success,
      };
    });

    // 3. List Resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resourceList = Array.from(this.resources.values()).map((r) => ({
        uri: r.metadata.uri,
        name: r.metadata.name,
        description: r.metadata.description,
        mimeType: r.metadata.mimeType ?? 'application/json',
      }));
      return { resources: resourceList };
    });

    // 4. Read Resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      const resource = this.resources.get(uri);

      if (!resource) {
        throw new Error(`Resource '${uri}' not found`);
      }

      const context = await Authenticator.resolveContext({});
      const result = await resource.read(context);

      return {
        contents: [
          {
            uri: result.uri,
            mimeType: result.mimeType,
            text: JSON.stringify(result.content, null, 2),
          },
        ],
      };
    });

    // 5. List Prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const promptList = Array.from(this.prompts.values()).map((p) => ({
        name: p.metadata.name,
        description: p.metadata.description,
        arguments: p.metadata.arguments?.map((arg) => ({
          name: arg.name,
          description: arg.description,
          required: arg.required,
        })),
      }));
      return { prompts: promptList };
    });

    // 6. Get Prompt
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const promptName = request.params.name;
      const prompt = this.prompts.get(promptName);

      if (!prompt) {
        throw new Error(`Prompt '${promptName}' not found`);
      }

      const context = await Authenticator.resolveContext({});
      const messages = await prompt.render(request.params.arguments, context);

      return {
        messages: messages.map((m) => ({
          role: m.role,
          content: {
            type: 'text',
            text: m.content,
          },
        })),
      };
    });
  }

  public async start(): Promise<void> {
    this.transportInstance = TransportFactory.createTransport(this.server, config.MCP_TRANSPORT);
    await this.transportInstance.start();
    auditLogger.logEvent({
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      eventType: 'tool_invocation',
      tenantId: 'system',
      userId: 'system',
      companyId: 'system',
      target: 'server.bootstrap',
      status: 'success',
      metadata: { transport: this.transportInstance.type },
    });
  }

  public async stop(): Promise<void> {
    if (this.transportInstance) {
      await this.transportInstance.close();
    }
  }
}
