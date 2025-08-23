import { injectable } from "tsyringe";
import { Response, Router, Request } from "express";
import { ConfigOptions } from "../config";
import LoggerProvider from "../utils/LoggerProvider";
import winston from "winston";
import McpError from "./McpError";
import McpTransportManager from "./McpTransportManager";
//import AuthenticationMiddlewareProvider from "../../auth/AuthenticationMiddlewareProvider";

const MCP_PATH = "/mcp";
//const MCP_SESSION_ID_HEADER = "mcp-session-id";
const AMAZON_TRACE_ID_HEADER = "x-amzn-trace-id";

/** Configure MCP HTTP requests
 * Based on https://github.com/aws-samples/sample-serverless-mcp-servers/tree/main/stateful-mcp-on-ecs-nodejs
 */
@injectable()
export default class McpController {
  private logger: winston.Logger;

  constructor(
    protected config: ConfigOptions,
    protected loggerProvider: LoggerProvider,
    protected mcpTransportManager: McpTransportManager
  ) {
    this.logger = loggerProvider.provide("McpController");
  }

  public registerRoutes(app: Router) {
    app.post(MCP_PATH, this.postRequestHandler.bind(this));
    app.get(MCP_PATH, this.sessionRequestHandler.bind(this));
    app.delete(MCP_PATH, this.sessionRequestHandler.bind(this));
  }

  private async postRequestHandler(req: Request, res: Response) {
    this.logger.info("postRequestHandler");
    const traceId = this.getTraceId(req);

    const transportAndServer = await this.mcpTransportManager.createTransport(
      traceId
    );
    const { transport, server } = transportAndServer;

    // Gracefully close transport and server when request ends
    res.on("close", () => {
      this.logger.info(`request processing complete`);
      transport.close();
      server.close();
    });

    await transport.handleRequest(req, res, req.body);
  }

  private async sessionRequestHandler(_req: Request, res: Response) {
    res.status(405).set("Allow", "POST").json(McpError.methodNotAllowed);
    // const sessionId = this.getSessionId(req);

    // this.logger.info(`sessionRequestHandler`, { sessionId });
    // if (!sessionId) {
    //   res.status(404).json(McpError.invalidOrMissingSessionId);
    //   return;
    // }

    // const transport = await this.mcpTransportManager.createOrGetTransport(
    //   sessionId
    // );

    // await transport.handleRequest(req, res, req.body);
  }

  /** Get Amazon trace ID from header */
  private getTraceId(req: Request): string | null {
    const sessionIdHeader = req.headers[AMAZON_TRACE_ID_HEADER];

    if (!sessionIdHeader) {
      return null;
    } else if (typeof sessionIdHeader === "string") {
      return sessionIdHeader;
    } else if (sessionIdHeader.length > 0) {
      return sessionIdHeader[0];
    }

    return null;
  }

  // private getSessionId(req: Request): string | null {
  //   const sessionIdHeader = req.headers[MCP_SESSION_ID_HEADER];

  //   if (!sessionIdHeader) {
  //     return null;
  //   } else if (typeof sessionIdHeader === "string") {
  //     return sessionIdHeader;
  //   } else if (sessionIdHeader.length > 0) {
  //     return sessionIdHeader[0];
  //   }

  //   return null;
  // }
}
