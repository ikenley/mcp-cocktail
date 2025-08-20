import { DependencyContainer } from "tsyringe";
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

export const RequestIdToken = "requestId";

/** Create a request-level dependency injection container.
 * Useful for request-scoped dependencies.
 * Also useful for log tracing, via the requestId
 */
export default class DependencyInjectionMiddlewareProvider {
  constructor(protected container: DependencyContainer) {}

  provide() {
    const middleware = async (
      _req: Request,
      res: Response,
      next: NextFunction
    ) => {
      const requestId = uuidv4();

      const requestContainer = this.container.createChildContainer();
      requestContainer.register(RequestIdToken, { useValue: requestId });
      res.locals.container = requestContainer;

      // Reset container when request finishes
      res.on("finish", () => {
        requestContainer.reset();
      });

      next();
    };

    return middleware;
  }
}
