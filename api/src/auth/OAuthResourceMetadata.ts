import { ConfigOptions } from "../config";
import { injectable } from "tsyringe";

@injectable()
export default class OAuthResourceMetadata {
  resource: string;
  authorization_servers: string[];
  bearer_methods_supported: string[];
  scopes_supported: string[];
  resource_documentation: string;

  constructor(protected config: ConfigOptions) {
    const genericAuthServerUrl = `${config.baseUrl}/.well-known/oauth-authorization-server`;
    (this.resource = config.baseUrl),
      (this.authorization_servers = [genericAuthServerUrl]),
      (this.bearer_methods_supported = ["header"]),
      (this.scopes_supported = [
        "openid",
        "profile",
        "email",
        "mcp-api/read",
        "mcp-api/write",
      ]),
      (this.resource_documentation = `${config.baseUrl}/docs`);
  }
}
