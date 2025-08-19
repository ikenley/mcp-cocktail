import { injectable } from "tsyringe";
import { Response, Router, Request } from "express";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { ConfigOptions } from "../config";
import LoggerProvider from "src/utils/LoggerProvider";
import winston from "winston";
import McpError from "./McpError";
import McpServerProvider from "./McpServerProvider";
//import AuthenticationMiddlewareProvider from "../../auth/AuthenticationMiddlewareProvider";

const MCP_PATH = "/mcp";
const MCP_SESSION_ID_HEADER = "mcp-session-id";

const route = Router();

const transports = new Map<string, StreamableHTTPServerTransport>();

/** Configure MCP HTTP requests
 * Based on https://github.com/aws-samples/sample-serverless-mcp-servers/tree/main/stateful-mcp-on-ecs-nodejs
 */
@injectable()
export default class McpController {
  private logger: winston.Logger;

  constructor(
    protected config: ConfigOptions,
    protected loggerProvider: LoggerProvider,
    protected mcpServerProvider: McpServerProvider
  ) {
    this.logger = loggerProvider.provide("DrinkService");
  }

  public registerRoutes(app: Router) {
    app.use("/mcp", route);

    //route.use(this.authenticationMiddlewareProvider.provide());

    // const getService = (res: Response) => {
    //   const container = res.locals.container as DependencyContainer;
    //   return container.resolve(DrinkService);
    // };

    route.post(MCP_PATH, this.postRequestHandler);
    route.get(MCP_PATH, this.sessionRequestHandler);
    route.delete(MCP_PATH, this.sessionRequestHandler);
  }

  private async postRequestHandler(req: Request, res: Response) {
    const sessionId = this.getSessionId(req);

    this.logger.info(`> sessionId=${sessionId}`);
    let transport: StreamableHTTPServerTransport | null = null;

    if (sessionId && transports.has(sessionId)) {
      this.logger.info(`using existing transport for sessionid=${sessionId}`);
      // Reuse existing transport
      transport = transports.get(sessionId) ?? null;
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request
      // Create new instances of MCP Server and Transport
      this.logger.info(`creating new MCP Server and Transport`);
      const nextSessionId = randomUUID();
      const newMcpServer = await this.mcpServerProvider.create(nextSessionId);
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => nextSessionId,
        onsessioninitialized: (sessionId) => {
          this.logger.info(`session initialized for sessionid=${sessionId}`);
          if (transport) {
            transports.set(sessionId, transport);
          }
        },
        // Uncomment if you want to disable SSE in responses
        // enableJsonResponse: true,
      });

      transport.onclose = () => {
        if (transport && transport.sessionId) {
          this.logger.info(`deleting transport for sessionid=${sessionId}`);
          if (sessionId) {
            transports.delete(sessionId);
          }
        }
      };

      await newMcpServer.connect(transport);
    } else {
      // Invalid request
      this.logger.info(`Prodived invalid sessionId=${sessionId}`);
      res.status(400).json(McpError.noValidSessionId);
      return;
    }

    if (transport) {
      await transport.handleRequest(req, res, req.body);
    }
  }

  private async sessionRequestHandler(req: Request, res: Response) {
    const sessionId = this.getSessionId(req);

    this.logger.info(`> sessionId=${sessionId}`);
    if (!sessionId || !transports.has(sessionId)) {
      res.status(404).json(McpError.invalidOrMissingSessionId);
      return;
    }

    const transport = transports.get(sessionId);
    if (transport) {
      await transport.handleRequest(req, res);
    }
  }

  /** Get session ID from header */
  private getSessionId(req: Request): string | undefined {
    const sessionIdHeader = req.headers[MCP_SESSION_ID_HEADER];

    if (!sessionIdHeader) {
      return undefined;
    } else if (typeof sessionIdHeader === "string") {
      return sessionIdHeader;
    } else if (sessionIdHeader.length > 0) {
      return sessionIdHeader[0];
    }

    return undefined;
  }
}
