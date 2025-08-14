import { injectable } from "tsyringe";
import { Router } from "express";
import DrinkController from "../components/drink/DrinkController";
import StatusController from "../components/status/StatusController";

@injectable()
export default class RouteService {
  constructor(
    protected drinkController: DrinkController,
    protected statusController: StatusController
  ) {}

  public registerRoutes() {
    const app = Router();

    this.drinkController.registerRoutes(app);
    this.statusController.registerRoutes(app);

    return app;
  }
}
