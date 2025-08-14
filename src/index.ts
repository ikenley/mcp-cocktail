import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
//import { z } from "zod";
import { getConfigOptions } from "./config/index.js";
import { DrinkResponse } from "./types/index.js";
import Drink from "../api/src/components/drink/Drink.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

const USER_AGENT = "cocktail-app/1.0";

const config = getConfigOptions();

// Create server instance
const server = new McpServer({
  name: "cocktail",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Register weather tools
server.tool(
  "get-random-cocktail",
  "Get random cocktail recommendation",
  {},
  getRandomCocktail
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

//getRandomCocktail();

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
