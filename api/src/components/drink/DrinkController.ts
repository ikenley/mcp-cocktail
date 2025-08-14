import { DependencyContainer, injectable } from "tsyringe";
import { Response, Router } from "express";
import { ConfigOptions } from "../../config";
//import AuthenticationMiddlewareProvider from "../../auth/AuthenticationMiddlewareProvider";
import DrinkService from "./DrinkService";

const route = Router();

@injectable()
export default class DrinkController {
  constructor(
    protected config: ConfigOptions //protected authenticationMiddlewareProvider: AuthenticationMiddlewareProvider
  ) {}

  public registerRoutes(app: Router) {
    app.use("/drink", route);

    //route.use(this.authenticationMiddlewareProvider.provide());

    const getService = (res: Response) => {
      const container = res.locals.container as DependencyContainer;
      return container.resolve(DrinkService);
    };

    route.get("/random", async (_req, res) => {
      const service = getService(res);
      const result = await service.getRandomCocktail();
      res.send(result);
    });
  }
}
