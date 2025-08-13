import "reflect-metadata";
import { container } from "tsyringe";
import { SQSEvent, Context } from "aws-lambda";
import { SSMClient } from "@aws-sdk/client-ssm";
import registerJobRunnerDependencies from "./loaders/registerJobRunnerDependencies";
import JobRunnerService from "./components/image/JobRunnerService";
import SsmParamLoader from "./loaders/SsmParamLoader";

let jobRunnerService: JobRunnerService | null = null;

/** Initial setup which should run on lambda startup. */
const setup = async (event: SQSEvent) => {
  // Inject SSM param configuration into env vars
  const ssmClient = new SSMClient();
  const ssmParamLoader = new SsmParamLoader(ssmClient);
  const configParamName = process.env.CONFIG_SSM_PARAM_NAME!;
  await ssmParamLoader.loadToEnv(configParamName);

  // Register dependencies
  await registerJobRunnerDependencies();

  jobRunnerService = container.resolve(JobRunnerService);
  return jobRunnerService.handleEvent(event);
};

/** Main entrypoint for Lambda function version of express app */
export const handler = (event: SQSEvent, _context: Context) => {
  if (jobRunnerService) {
    return jobRunnerService.handleEvent(event);
  }

  return setup(event);
};

export default handler;
