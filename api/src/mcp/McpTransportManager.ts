import { injectable } from "tsyringe";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import LoggerProvider from "../utils/LoggerProvider";
import winston from "winston";
import McpServerProvider from "./McpServerProvider";

const transports = new Map<string, StreamableHTTPServerTransport>();

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

  /** Gets StreamableHTTPServerTransport by session ID.
   * It will fetch it from memory if it exists.
   * Otherwise, it will create a new transport and MCP server.
   */
  public async createOrGetTransport(
    sessionId: string | null
  ): Promise<StreamableHTTPServerTransport> {
    this.logger.info("createOrGetTransport:params", { sessionId });

    // If transport exists, return it
    const nextSessionId = sessionId ?? randomUUID();
    let transport = transports.get(nextSessionId);
    if (transport) {
      this.logger.info(`Using existing transport`, { sessionId });
      return transport;
    }

    // Else create new Transport and MCPServer
    // New initialization request
    // Create new instances of MCP Server and Transport
    this.logger.info(`creating new MCP Server and Transport`);

    const newMcpServer = await this.mcpServerProvider.create(nextSessionId);
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => nextSessionId,
      onsessioninitialized: (sessionId) => {
        this.logger.info(`Session initialized`, { sessionId });
        if (transport) {
          transports.set(sessionId, transport);
        }
      },
      // Uncomment if you want to disable SSE in responses
      // enableJsonResponse: true,
    });

    transport.onclose = () => {
      if (transport && transport.sessionId) {
        this.logger.info(`Deleting transport`, { sessionId });
        if (sessionId) {
          transports.delete(sessionId);
        }
      }
    };

    await newMcpServer.connect(transport);
    return transport;
  }
}
