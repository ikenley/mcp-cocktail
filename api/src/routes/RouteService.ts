import { injectable } from "tsyringe";
import { Router } from "express";
import DrinkController from "../components/drink/DrinkController";
import StatusController from "../components/status/StatusController";
import McpController from "../mcp/McpController";

@injectable()
export default class RouteService {
  constructor(
    protected drinkController: DrinkController,
    protected mcpController: McpController,
    protected statusController: StatusController
  ) {}

  public registerRoutes() {
    const app = Router();

    this.drinkController.registerRoutes(app);
    this.mcpController.registerRoutes(app);
    this.statusController.registerRoutes(app);

    return app;
  }
}
