import { DependencyContainer, injectable } from "tsyringe";
import { Request, Response, Router } from "express";
import { RequestImageParams } from "../../types";
import { ConfigOptions } from "../../config";
import AuthenticationMiddlewareProvider from "../../auth/AuthenticationMiddlewareProvider";
import AuthorizationMiddleware from "../../auth/AuthorizationMiddleware";
import ImageMetadataService from "./ImageMetadataService";

const route = Router();

@injectable()
export default class ImageController {
  constructor(
    protected config: ConfigOptions,
    protected authenticationMiddlewareProvider: AuthenticationMiddlewareProvider,
    protected authorizationMiddleware: AuthorizationMiddleware
  ) {}

  public registerRoutes(app: Router) {
    app.use("/image", route);

    route.use(this.authenticationMiddlewareProvider.provide());
    route.use(this.authorizationMiddleware.isAuthorized);

    const getService = (res: Response) => {
      const container = res.locals.container as DependencyContainer;
      return container.resolve(ImageMetadataService);
    };

    route.post("/", async (req: Request<{}, {}, RequestImageParams>, res) => {
      const service = getService(res);
      await service.publishImageRequest(req.body);
      res.send({});
    });
  }
}
