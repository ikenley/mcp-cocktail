import { readFileSync } from "fs";
import { writeFile } from "fs/promises";
import * as path from "path";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { injectable } from "tsyringe";
import winston from "winston";
import LoggerProvider from "../../utils/LoggerProvider";
import { ConfigOptions } from "../../config";
import EmailService from "../../services/EmailService";
import CreateImageMessage from "./CreateImageMessage";
import ImageMetadataService from "./ImageMetadataService";

@injectable()
export default class ImageGeneratorService {
  private logger: winston.Logger;

  constructor(
    protected loggerProvider: LoggerProvider,
    protected config: ConfigOptions,
    protected bedrockRuntimeClient: BedrockRuntimeClient,
    protected s3Client: S3Client,
    protected emailService: EmailService,
    protected imageMetadataService: ImageMetadataService
  ) {
    this.logger = loggerProvider.provide("ImageGeneratorService");
  }

  /** Generate an image based on a prompt, save it to S3, and send image link. */
  public async generate(message: CreateImageMessage) {
    const { imageId, prompt, email } = message;

    const filePath = await this.createImage(imageId, prompt);

    const s3Key = await this.uploadToS3(imageId, filePath);

    await this.sendEmail(email, s3Key, prompt);

    await this.imageMetadataService.markCompleted(imageId);
  }

  /** Generate an image based on a prompt */
  private async createImage(imageId: string, prompt: string) {
    const input = {
      // InvokeModelRequest
      body: JSON.stringify({
        taskType: "TEXT_IMAGE",
        textToImageParams: { text: prompt },
        imageGenerationConfig: {
          numberOfImages: 1,
          quality: "premium",
          cfgScale: 8.0,
          height: 1024,
          width: 1024,
        },
      }),
      contentType: "application/json",
      accept: "*/*",
      modelId: "amazon.nova-canvas-v1:0",
    };
    const command = new InvokeModelCommand(input);
    this.logger.info("createImage", { imageId, prompt });
    const response = await this.bedrockRuntimeClient.send(command);

    const blobAdapter = response.body;
    const textDecoder = new TextDecoder("utf-8");
    const jsonString = textDecoder.decode(blobAdapter.buffer);

    try {
      const parsedData = JSON.parse(jsonString);
      const base64Data = parsedData.images[0];
      const filePath = path.join("/tmp", `${imageId}.png`);
      await writeFile(filePath, base64Data, { encoding: "base64" });
      return filePath;
    } catch (error: any) {
      this.logger.error("Error parsing JSON:", error);
      throw new Error(error);
    }
  }

  private async uploadToS3(imageId: string, filePath: string) {
    const fileContent = readFileSync(filePath); // This is inefficient, but works for small images
    const s3Key = `img/${imageId}.png`;
    const input = {
      Body: fileContent,
      Bucket: this.config.imageS3BucketName,
      Key: s3Key,
    };
    this.logger.info("uploadToS3", { s3Key });
    const command = new PutObjectCommand(input);
    await this.s3Client.send(command);

    return s3Key;
  }

  private async sendEmail(
    destinationEmail: string,
    s3Key: string,
    prompt: string
  ) {
    this.logger.info("sendEmail", { destinationEmail });

    const subject = "Your AI-generated image is ready";
    const textMessage = `Your AI-generated image is ready.
            Prompt: "${prompt}"
            Result https://${this.config.imageS3BucketName}/${s3Key}
            To create more images, visit https://ai.ikenley.com/ai/image`;
    const htmlMessage = `<p>Your AI-generated image is ready.</p>
            <p>Prompt: "${prompt}"</p>
            <p>Result: <br />
            <img src="https://${this.config.imageS3BucketName}/${s3Key}" /></p>
            <p>To create more images, visit <a href="https://ai.ikenley.com/ai/image">ai.ikenley.com/image</a></p>`;

    await this.emailService.sendEmail(
      destinationEmail,
      subject,
      textMessage,
      htmlMessage
    );
  }
}
