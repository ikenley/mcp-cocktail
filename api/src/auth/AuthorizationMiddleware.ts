import winston from "winston";
import { injectable } from "tsyringe";
import { Request, Response, NextFunction } from "express";
import { ConfigOptions } from "../config";
import LoggerProvider from "../utils/LoggerProvider";
import User from "./User";
import ForbiddenException from "../middleware/ForbiddenException";

/** Checks whether a user is on a narrow allow-list */
@injectable()
export default class AuthorizationMiddleware {
  private logger: winston.Logger;

  constructor(
    protected loggerProvider: LoggerProvider,
    protected config: ConfigOptions
  ) {
    this.logger = loggerProvider.provide("AuthorizationMiddleware");
  }

  /** Provide array of "isAuthenticated" and "isAuthorized" middleware */
  public isAuthorized = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    // Inject User to request-level dependency injection container
    const requestContainer = res.locals.container;
    const user = requestContainer.resolve(User);

    // If user on authorized emails list, continue
    if (this.config.authorizedEmails.includes(user.email)) {
      next();
    }
    // else return 403 error
    else {
      this.logger.info("Unauthorized user", { email: user.email });
      throw new ForbiddenException();
    }
  };
}
