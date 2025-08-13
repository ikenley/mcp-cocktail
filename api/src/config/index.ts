import dotenv from "dotenv";

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || "development";

dotenv.config({ path: "../.env" });

export type AppEnv = "local" | "test" | "dev" | "staging" | "prod";

export class ConfigOptions {
  api: { prefix: string };
  app: { env: AppEnv; name: string; version: string };
  authorizedEmails: string[];
  aws: {
    region: string;
  };
  baseDomain: string | null;
  bedrockAgent: {
    agentId: string;
    agentAliasId: string;
  };
  cognito: {
    userPoolId: string;
    userPoolClientId: string;
    userPoolClientSecret: string;
  };
  fromEmailAddress: string;
  imageMetadataTableName: string;
  imageS3BucketName: string;
  jobQueueUrl: string;
  // db: {
  //   host: string;
  //   port: number;
  //   user: string;
  //   password: string;
  //   database: string;
  //   schema: string;
  // };
  logs: { level: string };
  nodeEnv: string;
  port: number;
  stateFunctionArn: string;
}

/** Get ConfigOptions from env vars.
 * (This is a function to lazy-load and
 *    give bootstrap services time to inject env vars)
 */
export const getConfigOptions = () => {
  const authorizedEmailsJson = process.env.AUTHORIZED_EMAILS || "[]";
  const authorizedEmails = JSON.parse(authorizedEmailsJson) as string[];

  const config: ConfigOptions = {
    api: { prefix: "/ai/api" },
    app: {
      env: process.env.APP_ENV as AppEnv,
      name: process.env.APP_NAME || "ai-api",
      version: process.env.APP_VERSION!,
    },
    authorizedEmails: authorizedEmails,
    aws: {
      region: process.env.AWS_REGION!,
    },
    baseDomain: process.env.BASE_DOMAIN || null,
    bedrockAgent: {
      agentId: process.env.BEDROCK_AGENT_ID!,
      agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID!,
    },
    cognito: {
      userPoolId: process.env.COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.COGNITO_USER_POOL_CLIENT_ID!,
      userPoolClientSecret: process.env.COGNITO_USER_POOL_CLIENT_SECRET!,
    },
    fromEmailAddress: process.env.FROM_EMAIL_ADDRESS!,
    imageMetadataTableName: process.env.IMAGE_METADATA_TABLE_NAME!,
    jobQueueUrl: process.env.JOB_QUEUE_URL!,
    // db: {
    //   host: process.env.DB_HOST!,
    //   port: parseInt(process.env.DB_PORT!),
    //   user: process.env.DB_USER!,
    //   password: process.env.DB_PASSWORD!,
    //   database: process.env.DB_DATABASE!,
    //   schema: process.env.DB_SCEHMA!,
    // },
    logs: { level: process.env.LOGS__LEVEL || "http" },
    nodeEnv: process.env.NODE_ENV!,
    port: parseInt(process.env.PORT || "8086", 10),
    imageS3BucketName: process.env.IMAGE_S3_BUCKET_NAME!,
    stateFunctionArn: process.env.STATE_FUNCTION_ARN!,
  };

  return config;
};
