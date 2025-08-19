import { container } from "tsyringe";
import { NIL } from "uuid";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { ConfigOptions, getConfigOptions } from "../config";
import LoggerInstance, { LoggerToken } from "./logger";
import { CognitoJwtVerifierToken } from "../types";
import DependencyInjectionMiddlewareProvider, {
  RequestIdToken,
} from "../middleware/DependencyInjectionMiddlewareProvider";

export default () => {
  try {
    const config = getConfigOptions();
    container.register(ConfigOptions, { useValue: config });

    container.register(LoggerToken, { useValue: LoggerInstance });

    // Configure request-level middleware provider
    container.register(DependencyInjectionMiddlewareProvider, {
      useFactory: (c) => new DependencyInjectionMiddlewareProvider(c),
    });

    // Register default request Id.
    // This will be replaced by request-level dependency container in most cases
    container.register(RequestIdToken, { useValue: NIL });

    const jwtVerifier = CognitoJwtVerifier.create({
      userPoolId: config.cognito.userPoolId,
      tokenUse: "id",
      clientId: config.cognito.userPoolClientId,
    });
    container.register(CognitoJwtVerifierToken, { useValue: jwtVerifier });
  } catch (e) {
    LoggerInstance.error("🔥 Error on dependency injector loader: %o", e);
    throw e;
  }
};
