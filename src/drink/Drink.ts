import { DrinkType, IngredientWithMeasure, RawDrink } from "../types/index.js";

export default class Drink implements DrinkType {
  id: string;
  name: string;
  category: string;
  glass: string;
  instructions: string;
  thumb: string;
  imageSource: string | null;
  ingredients: IngredientWithMeasure[];

  constructor(raw: RawDrink) {
    this.id = raw.idDrink;
    this.name = raw.strDrink;
    this.category = raw.strCategory;
    this.glass = raw.strGlass;
    this.instructions = raw.strInstructions;
    this.thumb = raw.strDrinkThumb;
    this.imageSource = raw.strImageSource;
    this.ingredients = Drink.getIngredients(raw);
  }

  private static getIngredients(raw: RawDrink): IngredientWithMeasure[] {
    const rawIngredients = [
      raw.strIngredient1,
      raw.strIngredient2,
      raw.strIngredient3,
      raw.strIngredient4,
      raw.strIngredient5,
      raw.strIngredient6,
      raw.strIngredient7,
      raw.strIngredient8,
      raw.strIngredient9,
      raw.strIngredient10,
      raw.strIngredient11,
      raw.strIngredient12,
      raw.strIngredient13,
      raw.strIngredient14,
      raw.strIngredient15,
    ];

    const rawMeasures = [
      raw.strMeasure1,
      raw.strMeasure2,
      raw.strMeasure3,
      raw.strMeasure4,
      raw.strMeasure5,
      raw.strMeasure6,
      raw.strMeasure7,
      raw.strMeasure8,
      raw.strMeasure9,
      raw.strMeasure10,
      raw.strMeasure11,
      raw.strMeasure12,
      raw.strMeasure13,
      raw.strMeasure14,
      raw.strMeasure15,
    ];

    const combined: IngredientWithMeasure[] = rawIngredients.map(
      (ingredient, ix) => {
        return { ingredient: ingredient || "", measure: rawMeasures[ix] || "" };
      }
    );

    const filtered = combined.filter(
      (ing) => ing.ingredient !== "" && ing.measure !== ""
    );

    return filtered;
  }

  public formatIngredients(): string {
    return this.ingredients
      .map((ing) => `${ing.measure} ${ing.ingredient}`)
      .join("\n\t");
  }
}
