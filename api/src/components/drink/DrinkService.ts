import { injectable } from "tsyringe";
import winston from "winston";
import { DrinkResponse } from "../../types";
import { ConfigOptions } from "../../config";
import LoggerProvider from "../../utils/LoggerProvider";
import Drink from "./Drink";

const USER_AGENT = "cocktail-app/1.0";

@injectable()
export default class DrinkService {
  private logger: winston.Logger;

  constructor(
    protected loggerProvider: LoggerProvider,
    protected config: ConfigOptions
  ) {
    this.logger = loggerProvider.provide("DrinkService");
  }

  /** Get random cocktail recommendation */
  public async getRandomCocktail(): Promise<string> {
    this.logger.info("getRandomCocktail");

    const url = `https://www.thecocktaildb.com/api/json/v2/${this.config.cocktailDbApiKey}/random.php`;
    const drinkResponse = await this.makeDrinkRequest<DrinkResponse>(url);

    if (
      !drinkResponse ||
      !drinkResponse.drinks ||
      drinkResponse.drinks.length < 1
    ) {
      return "Failed to retrieve drinks data";
    }

    const drink = new Drink(drinkResponse.drinks[0]);

    const responseText = this.formatDrink(drink);
    this.logger.info("getRandomCocktail:responseText", { responseText });

    return responseText;
  }

  /** Helper function for making cocktail API requests */
  private async makeDrinkRequest<T>(url: string): Promise<T | null> {
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

  /* Format Drink data */
  private formatDrink(drink: Drink): string {
    const formattedIngredients = drink.formatIngredients();

    return [
      `Name: ${drink.name}`,
      `Category: ${drink.category}`,
      `Glass: ${drink.glass}`,
      `Ingredients: \n${formattedIngredients}`,
      `Instructions: ${drink.instructions}`,
      "---",
    ].join("\n");
  }
}
