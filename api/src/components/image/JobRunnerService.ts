import { injectable } from "tsyringe";
import winston from "winston";
import { SQSEvent } from "aws-lambda";
import LoggerProvider from "../../utils/LoggerProvider";
import ImageGeneratorService from "./ImageGeneratorService";
import CreateImageMessage from "./CreateImageMessage";

/** Handler for job-runner lambda function.
 * Parses event and routes to relevent business layer.
 */
@injectable()
export default class JobRunnerService {
  private logger: winston.Logger;

  constructor(
    protected loggerProvider: LoggerProvider,
    protected imageGeneratorService: ImageGeneratorService
  ) {
    this.logger = loggerProvider.provide("JobRunnerService");
  }

  public async handleEvent(event: SQSEvent) {
    this.logger.info("handleEvent", event);

    const message = JSON.parse(event.Records[0].body) as CreateImageMessage;
    this.logger.info("message", message);

    await this.imageGeneratorService.generate(message);
  }
}
