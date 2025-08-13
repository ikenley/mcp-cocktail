import { inject, injectable } from "tsyringe";
import winston from "winston";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import LoggerProvider from "../../utils/LoggerProvider";
import { ConfigOptions } from "../../config";
import User from "../../auth/User";
import { RequestIdToken } from "../../middleware/dependencyInjectionMiddleware";
import { CreateStoryParams } from "../../types";

@injectable()
export default class StorybookService {
  private logger: winston.Logger;

  constructor(
    protected loggerProvider: LoggerProvider,
    protected config: ConfigOptions,
    protected user: User,
    @inject(RequestIdToken) protected requestId: string,
    protected sfnClient: SFNClient
  ) {
    this.logger = loggerProvider.provide("StorybookService");
  }

  /** Generate an image based on a prompt, save it to S3, and send image link. */
  public async create(params: CreateStoryParams): Promise<void> {
    const { title, description, artNote } = params;
    this.logger.info(`create`, { title, description, artNote });

    await this.startJobExecution(title, description, artNote);
  }

  /** Trigger the AWS Step Function execution */
  private async startJobExecution(
    title: string,
    description: string,
    artNote: string
  ): Promise<void> {
    const input = {
      stateMachineArn: this.config.stateFunctionArn,
      name: this.requestId,
      input: JSON.stringify({
        Title: title,
        Description: description,
        ArtNote: artNote,
        UserEmailAddress: this.user.email,
      }),
    };
    this.logger.info(`startJobExecution`, { input });
    const command = new StartExecutionCommand(input);
    await this.sfnClient.send(command);
  }
}
