import winston from "winston";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import LoggerProvider from "../utils/LoggerProvider";
import { injectable } from "tsyringe";
import { ConfigOptions } from "../config";
import DrinkController from "../components/drink/DrinkController";
import SessionDiContainerProvider from "./SessionDiContainerProvider";

/** Create session-based MCP Server */
@injectable()
export default class McpServerProvider {
  private logger: winston.Logger;

  constructor(
    protected loggerProvider: LoggerProvider,
    protected config: ConfigOptions,
    protected sessionDiContainerProvider: SessionDiContainerProvider,
    protected drinkController: DrinkController
  ) {
    this.logger = loggerProvider.provide("McpServerProvider");
  }

  public async create(sessionId: string): Promise<McpServer> {
    this.logger.info("Creating a new McpServer", { sessionId });

    const server = new McpServer({
      name: "cocktail",
      version: "1.0.0",
      capabilities: {
        resources: {},
        tools: {},
      },
    });

    const diContainer = this.sessionDiContainerProvider.create(sessionId);

    // Register MCP blocks (tools, resources, prompts)
    this.drinkController.registerMcp(server, diContainer);

    return server;
  }
}
