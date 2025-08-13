import { DependencyContainer, injectable } from "tsyringe";
import { Request, Response, Router } from "express";
import { CreateStoryParams } from "../../types";
import { ConfigOptions } from "../../config";
import AuthenticationMiddlewareProvider from "../../auth/AuthenticationMiddlewareProvider";
import AuthorizationMiddleware from "../../auth/AuthorizationMiddleware";
import StorybookService from "./StorybookService";

const route = Router();

@injectable()
export default class StorybookController {
  constructor(
    protected config: ConfigOptions,
    protected authenticationMiddlewareProvider: AuthenticationMiddlewareProvider,
    protected authorizationMiddleware: AuthorizationMiddleware
  ) {}

  public registerRoutes(app: Router) {
    app.use("/storybook", route);

    route.use(this.authenticationMiddlewareProvider.provide());
    route.use(this.authorizationMiddleware.isAuthorized);

    const getService = (res: Response) => {
      const container = res.locals.container as DependencyContainer;
      return container.resolve(StorybookService);
    };

    route.post("/", async (req: Request<{}, {}, CreateStoryParams>, res) => {
      const service = getService(res);
      await service.create(req.body);
      res.send({});
    });
  }
}
