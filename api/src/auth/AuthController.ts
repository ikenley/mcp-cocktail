import { injectable } from "tsyringe";
import { Router } from "express";
import { ConfigOptions } from "../config";
import OAuthResourceMetadata from "./OAuthResourceMetadata";
import axios from "axios";

/** Expose OAuth endpoints.
 * Based on https://github.com/empires-security/mcp-oauth2-aws-cognito
 */
@injectable()
export default class DrinkController {
  constructor(
    protected config: ConfigOptions,
    protected resourceMetadata: OAuthResourceMetadata
  ) {}

  public registerRoutes(app: Router) {
    // Protected Resource Metadata endpoint
    app.get("/.well-known/oauth-protected-resource", (_req, res) => {
      res.json(this.resourceMetadata);
    });

    // Generic OAuth authorization server metadata endpoint (proxies to Cognito)
    app.get("/.well-known/oauth-authorization-server", async (_req, res) => {
      try {
        // Cognito uses OpenID Connect configuration, not OAuth authorization server endpoint
        // Convert the configured auth server URL to the correct OpenID configuration endpoint
        let cognitoMetadataUrl = config.cognito.authServerUrl;

        // If the configured URL points to oauth-authorization-server, change it to openid-configuration
        if (
          cognitoMetadataUrl.includes("/.well-known/oauth-authorization-server")
        ) {
          cognitoMetadataUrl = cognitoMetadataUrl.replace(
            "/.well-known/oauth-authorization-server",
            "/.well-known/openid-configuration"
          );
        }
        // If it doesn't have any well-known endpoint, add the OpenID configuration one
        else if (!cognitoMetadataUrl.includes("/.well-known/")) {
          cognitoMetadataUrl = `${cognitoMetadataUrl}/.well-known/openid-configuration`;
        }

        console.log(
          `Proxying authorization server metadata request to: ${cognitoMetadataUrl}`
        );
        const response = await axios.get(cognitoMetadataUrl);

        // Add registration_endpoint to the metadata for RFC 8414 compliance
        const metadata = response.data;
        metadata.registration_endpoint = process.env.DCR_ENDPOINT;

        // Add PKCE support indication if not already present
        // AWS Cognito supports PKCE but doesn't advertise it in metadata
        if (!metadata.code_challenge_methods_supported) {
          metadata.code_challenge_methods_supported = ["S256"];
        }

        res.json(metadata);
      } catch (error) {
        console.error(
          "Error proxying authorization server metadata:",
          error.message
        );
        res.status(500).json({
          error: "server_error",
          error_description: "Unable to retrieve authorization server metadata",
        });
      }
    });
  }
}
