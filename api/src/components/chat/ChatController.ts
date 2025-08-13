import { DependencyContainer, injectable } from "tsyringe";
import { Request, Response, Router } from "express";
import { SendChatParams } from "../../types";
import { ConfigOptions } from "../../config";
import AuthenticationMiddlewareProvider from "../../auth/AuthenticationMiddlewareProvider";
import AuthorizationMiddleware from "../../auth/AuthorizationMiddleware";
import ChatService from "./ChatService";

const route = Router();

@injectable()
export default class StorybookController {
  constructor(
    protected config: ConfigOptions,
    protected authenticationMiddlewareProvider: AuthenticationMiddlewareProvider,
    protected authorizationMiddleware: AuthorizationMiddleware
  ) {}

  public registerRoutes(app: Router) {
    app.use("/chat", route);

    route.use(this.authenticationMiddlewareProvider.provide());
    route.use(this.authorizationMiddleware.isAuthorized);

    const getService = (res: Response) => {
      const container = res.locals.container as DependencyContainer;
      return container.resolve(ChatService);
    };

    route.post("/", async (req: Request<{}, {}, SendChatParams>, res) => {
      const service = getService(res);
      const response = await service.sendPrompt(req.body);
      res.send(response);
    });
  }
}
