import dotenv from "dotenv";

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || "development";

dotenv.config({ path: ".env", quiet: true });

export type AppEnv = "local" | "test" | "dev" | "staging" | "prod";

export type ConfigOptions = {
  api: { prefix: string };
  app: { env: AppEnv; name: string; version: string };
  aws: {
    region: string;
  };
  cocktailDbApiKey: string;
  // baseDomain: string | null;
  // cognito: {
  //   userPoolId: string;
  //   userPoolClientId: string;
  //   userPoolClientSecret: string;
  // };
  logs: { level: string };
  nodeEnv: string;
  port: number;
};

/** Get ConfigOptions from env vars.
 * (This is a function to lazy-load and
 *    give bootstrap services time to inject env vars)
 */
export const getConfigOptions = () => {
  const config: ConfigOptions = {
    api: { prefix: "/ai/api" },
    app: {
      env: process.env.APP_ENV as AppEnv,
      name: process.env.APP_NAME || "ai-api",
      version: process.env.APP_VERSION!,
    },
    aws: {
      region: process.env.AWS_REGION!,
    },
    cocktailDbApiKey: process.env.COCKTAILDB_API_KEY!,
    // cognito: {
    //   userPoolId: process.env.COGNITO_USER_POOL_ID!,
    //   userPoolClientId: process.env.COGNITO_USER_POOL_CLIENT_ID!,
    //   userPoolClientSecret: process.env.COGNITO_USER_POOL_CLIENT_SECRET!,
    // },
    logs: { level: process.env.LOGS__LEVEL || "http" },
    nodeEnv: process.env.NODE_ENV!,
    port: parseInt(process.env.PORT || "8086", 10),
  };

  return config;
};
