import { injectable } from "tsyringe";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import LoggerProvider from "../utils/LoggerProvider";
import winston from "winston";
import McpServerProvider from "./McpServerProvider";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";

type TransportAndServer = {
  transport: StreamableHTTPServerTransport;
  server: McpServer;
};

/** Manages the creations and retrieval of StreamableHTTPServerTransport.
 * This is a naive implementation. It stores Transports in memory and creates them if missing.
 * The goal is not perfection. Rather the goal is a minimally-viable Lambda hosted MCP session.
 */
@injectable()
export default class McpTransportManager {
  private logger: winston.Logger;

  constructor(
    protected loggerProvider: LoggerProvider,
    protected mcpServerProvider: McpServerProvider
  ) {
    this.logger = loggerProvider.provide("McpTransportManager");
  }

  /** Creates StreamableHTTPServerTransport
   */
  public async createTransport(
    traceId: string | null
  ): Promise<TransportAndServer> {
    this.logger.info("createOrGetTransport:params");

    // Else create new Transport and MCPServer
    // New initialization request
    // Create new instances of MCP Server and Transport
    this.logger.info(`creating new MCP Server and Transport`);

    const sessionId = traceId || randomUUID();
    const server = await this.mcpServerProvider.create(sessionId);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      // onsessioninitialized: (sessionId) => {
      //   this.logger.info(`Session initialized`, { sessionId });
      //   if (transport) {
      //     transports.set(sessionId, transport);
      //   }
      // },
      // Uncomment if you want to disable SSE in responses
      // enableJsonResponse: true,
    });

    // transport.onclose = () => {
    //   if (transport && transport.sessionId) {
    //     this.logger.info(`Deleting transport`, { sessionId });
    //     if (sessionId) {
    //       transports.delete(sessionId);
    //     }
    //   }
    // };

    await server.connect(transport);
    return { transport, server };
  }
}
