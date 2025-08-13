import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { injectable } from "tsyringe";
import winston from "winston";
import LoggerProvider from "../utils/LoggerProvider";
import { ConfigOptions } from "../config";

/** Generalized email service.
 * Uses AWS SES.
 */
@injectable()
export default class EmailService {
  private logger: winston.Logger;

  constructor(
    protected loggerProvider: LoggerProvider,
    protected config: ConfigOptions,
    protected sesClient: SESClient
  ) {
    this.logger = loggerProvider.provide("EmailService");
  }

  public async sendEmail(
    destinationEmail: string,
    subject: string,
    textMessage: string,
    htmlMessage: string
  ) {
    this.logger.info("sendEmail", { destinationEmail });
    const input = {
      Source: this.config.fromEmailAddress,
      Destination: {
        ToAddresses: [destinationEmail],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Text: {
            Data: textMessage,
            Charset: "UTF-8",
          },
          Html: {
            Data: htmlMessage,
            Charset: "UTF-8",
          },
        },
      },
    };
    const command = new SendEmailCommand(input);
    await this.sesClient.send(command);
  }
}
