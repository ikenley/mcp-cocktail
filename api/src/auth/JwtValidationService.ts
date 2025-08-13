import winston from "winston";
import { injectable, inject } from "tsyringe";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { CognitoJwtVerifierToken } from "../types";
import UnauthorizedException from "../middleware/UnauthorizedException";
import LoggerProvider from "../utils/LoggerProvider";
import User from "./User";

@injectable()
export default class JwtValidationService {
  private logger: winston.Logger;

  constructor(
    protected loggerProvider: LoggerProvider,
    @inject(CognitoJwtVerifierToken)
    protected jwtVerifier: CognitoJwtVerifier<any, any, any>
  ) {
    this.logger = loggerProvider.provide("JwtValidationService");
  }

  /** Validates the authorization header*/
  public async validate(authHeader: string) {
    if (!authHeader) {
      throw new UnauthorizedException();
    }

    const headerParts = authHeader.split(" ");
    if (headerParts.length < 2) {
      throw new UnauthorizedException();
    }

    const idToken = headerParts[1];

    try {
      const decodedIdToken = await this.jwtVerifier.verify(idToken);
      const user = User.fromIdToken(decodedIdToken);
      return user;
    } catch (e: any) {
      this.logger.info("Invalid jwt", { e });
      throw new UnauthorizedException();
    }
  }
}
