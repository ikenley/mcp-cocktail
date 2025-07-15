import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
//import { z } from "zod";
import { getConfigOptions } from "./config/index.js";
import { RawDrink, DrinkResponse } from "./types/index.js";
import Drink from "./drink/Drink.js";

const NWS_API_BASE = "https://api.weather.gov";
const USER_AGENT = "weather-app/1.0";

const config = getConfigOptions();

// Create server instance
const server = new McpServer({
  name: "weather",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Helper function for making cocktail API requests
async function makeDrinkRequest<T>(url: string): Promise<T | null> {
  const headers = {
    "User-Agent": USER_AGENT,
    Accept: "application/json",
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error("Error making drink request:", error);
    return null;
  }
}

// Format alert data
function formatDrink(drink: Drink): string {
  const formattedIngredients = drink.formatIngredients();

  return [
    `Name: ${drink.name}`,
    `Category: ${drink.category}`,
    `Glass: ${drink.glass}`,
    `Ingredients: \n\t${formattedIngredients}`,
    `Instructions: ${drink.instructions}`,
    "---",
  ].join("\n");
}

// Register weather tools
server.tool(
  "get-random-cocktail",
  "Get random cocktail recommendation",
  {},
  async () => {
    const url = `https://www.thecocktaildb.com/api/json/v2/${config.cocktailDbApiKey}/random.php`;
    const drinkResponse = await makeDrinkRequest<DrinkResponse>(url);

    if (
      !drinkResponse ||
      !drinkResponse.drinks ||
      drinkResponse.drinks.length < 1
    ) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve drinks data",
          },
        ],
      };
    }

    const drink = new Drink(drinkResponse.drinks[0]);

    const responseText = formatDrink(drink);

    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
