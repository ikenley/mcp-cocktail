import { container } from "tsyringe";
import { NIL } from "uuid";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { SESClient } from "@aws-sdk/client-ses";
import { SQSClient } from "@aws-sdk/client-sqs";
import LoggerInstance from "./logger";
import { ConfigOptions, getConfigOptions } from "../config";
import { LoggerToken } from "./logger";
import { RequestIdToken } from "../middleware/dependencyInjectionMiddleware";
import User from "../auth/User";

/** Register dependencies for Job Runner service */
export default () => {
  try {
    const config = getConfigOptions();
    container.register(ConfigOptions, { useValue: config });

    container.register(LoggerToken, { useValue: LoggerInstance });

    // Register default request Id.
    // This will be replaced by request-level dependency container in most cases
    container.register(RequestIdToken, { useValue: NIL });

    // Register fake user for dependency injection work-around
    const defaultUser: User = {
      id: NIL,
      email: `default@example.net`,
    };
    container.register(User, { useValue: defaultUser });

    const bedrockClient = new BedrockRuntimeClient() as any;
    container.register(BedrockRuntimeClient, { useValue: bedrockClient });

    const dynamoDBClient = new DynamoDBClient() as any;
    container.register(DynamoDBClient, { useValue: dynamoDBClient });

    const s3Client = new S3Client() as any;
    container.register(S3Client, { useValue: s3Client });

    const sesClient = new SESClient() as any;
    container.register(SESClient, { useValue: sesClient });

    const sqsClient = new SQSClient() as any;
    container.register(SQSClient, { useValue: sqsClient });
  } catch (e) {
    LoggerInstance.error("🔥 Error on dependency injector loader: %o", e);
    throw e;
  }
};
