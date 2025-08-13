import { inject, injectable } from "tsyringe";
import winston from "winston";
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
  InvokeAgentCommandOutput,
  ReturnControlPayload,
} from "@aws-sdk/client-bedrock-agent-runtime";
import LoggerProvider from "../../utils/LoggerProvider";
import { ConfigOptions } from "../../config";
import User from "../../auth/User";
import { RequestIdToken } from "../../middleware/dependencyInjectionMiddleware";
import { SendChatParams, SendChatResponse } from "../../types";
import EmailService from "../../services/EmailService";

/** Service for managing interactions with AI chat agent. */
@injectable()
export default class ChatService {
  private logger: winston.Logger;

  constructor(
    protected loggerProvider: LoggerProvider,
    protected config: ConfigOptions,
    protected user: User,
    @inject(RequestIdToken) protected requestId: string,
    protected bedrockAgentClient: BedrockAgentRuntimeClient,
    protected emailService: EmailService
  ) {
    this.logger = loggerProvider.provide("ChatService");
  }

  /** Generate an image based on a prompt, save it to S3, and send image link. */
  public async sendPrompt(params: SendChatParams): Promise<SendChatResponse> {
    const { sessionId, prompt } = params;
    this.logger.info(`sendPrompt`, { sessionId, prompt });

    const response = await this.promptBedrockAgent(sessionId, prompt);
    return response;
  }

  /**
   * Invokes a Bedrock agent to run an inference using the input
   * provided in the request body.
   *
   * @param {string} sessionId - An arbitrary identifier for the session.
   * @param {string} prompt - The prompt that you want the Agent to complete.
   */
  private async promptBedrockAgent(
    sessionId: string,
    prompt: string
  ): Promise<SendChatResponse> {
    this.logger.info("promptBedrockAgent:begin", { sessionId });
    const { agentId, agentAliasId } = this.config.bedrockAgent;

    const command = new InvokeAgentCommand({
      agentId,
      agentAliasId,
      sessionId,
      inputText: prompt,
    });

    const response = await this.bedrockAgentClient.send(command);

    return await this.handleAgentResponse(sessionId, response);
  }

  /** Process the BedrockAgent response */
  private async handleAgentResponse(
    sessionId: string,
    response: InvokeAgentCommandOutput
  ): Promise<SendChatResponse> {
    let agentReply = "";
    if (response.completion === undefined) {
      throw new Error("Completion is undefined");
    }

    for await (let chunkEvent of response.completion) {
      //If response is of type "return control" handle ActionGroup on behalf of Agent
      if (chunkEvent.returnControl !== undefined) {
        return await this.handlReturnControl(
          sessionId,
          chunkEvent.returnControl
        );
      }

      // Else collect message chunks
      const chunk = chunkEvent.chunk;
      if (chunk) {
        const decodedResponse = new TextDecoder("utf-8").decode(chunk.bytes);
        agentReply += decodedResponse;
      }
    }

    const chatResponse: SendChatResponse = { sessionId, agentReply };
    return chatResponse;
  }

  /** Handle "return control" requests from Bedrock Agent.
   * These mean that the agent wants to invoke an "Action Group" (an internal API call).
   * Route to the correct function and return a response to the agent.
   */
  private async handlReturnControl(
    sessionId: string,
    returnControl: ReturnControlPayload
  ): Promise<SendChatResponse> {
    const { invocationId, invocationInputs } = returnControl;
    this.logger.info("handlReturnControl:inputs", {
      invocationId,
      invocationInputs,
    });

    if (
      !invocationId ||
      !invocationInputs ||
      invocationInputs.length === 0 ||
      !invocationInputs[0].functionInvocationInput
    ) {
      this.logger.error("Invalid invocationInputs");
      throw new Error("Invalid invocationInputs");
    }

    const invocationInput = invocationInputs[0].functionInvocationInput;
    const actionGroup = invocationInput.actionGroup ?? "";
    const functionName = invocationInput.function;

    // Route based on the functionName
    if (functionName === "SendSumaryEmail") {
      const summaryParam = invocationInput.parameters?.find(
        (p) => p.name === "summary"
      );
      if (!summaryParam) {
        this.logger.error("summaryParam not found");
        throw new Error("summaryParam not found");
      }

      const summary = summaryParam.value ?? "";
      return this.sendSummaryEmail(
        sessionId,
        invocationId,
        actionGroup,
        summary
      );
    }

    // If no matching functionName, throw error
    this.logger.error("Invalid functionName", { functionName });
    throw new Error("Invalid functionName");
  }

  /** Send summary email and return response to Bedrock Agent. */
  private async sendSummaryEmail(
    sessionId: string,
    invocationId: string,
    actionGroup: string,
    summary: string
  ): Promise<SendChatResponse> {
    this.logger.info("sendSummaryEmail", { sessionId, invocationId });

    const htmlSummary = summary.replace(/(?:\r\n|\r|\n)/g, "<br />");

    // Send email
    const subject = "Summary of AI chat";
    const textMessage = summary;
    const htmlMessage = `<div style="{white-space: pre-wrap;">${htmlSummary}</div>`;
    await this.emailService.sendEmail(
      this.user.email,
      subject,
      textMessage,
      htmlMessage
    );

    // Return response to agent
    const { agentId, agentAliasId } = this.config.bedrockAgent;
    const command = new InvokeAgentCommand({
      agentId,
      agentAliasId,
      sessionId,
      sessionState: {
        invocationId,
        returnControlInvocationResults: [
          {
            functionResult: {
              actionGroup: actionGroup,
              function: "SendSumaryEmail",
              responseBody: {
                TEXT: {
                  body: "Your email has been sent",
                },
              },
            },
          },
        ],
      },
    });

    const response = await this.bedrockAgentClient.send(command);

    return await this.handleAgentResponse(sessionId, response);
  }
}
