import db from './database';
import { Product } from './products';

export type Meal = {
    id: number;
    name: string;
    is_favorite: number;
    totalCalories: number;
    totalProtein: number;
};

export function insertMeal(name: string, isFavorite: number = 0): number {
    const statement = db.prepareSync(
        'INSERT INTO meals (name, is_favorite) VALUES (?, ?)'
    );

    const result = statement.executeSync([name, isFavorite]);
    return result.lastInsertRowId;
}

export function getAllMeals(): Meal[] {
    return db.getAllSync<Meal>('SELECT m.*, COALESCE(SUM(p.calories * (mi.grams / 100.0)), 0) AS totalCalories, COALESCE(SUM(p.protein * (mi.grams / 100.0)), 0) AS totalProtein FROM meals m LEFT JOIN meal_ingredients mi ON m.id = mi.meal_id LEFT JOIN products p ON mi.product_id = p.id GROUP BY m.id');
}

export function insertMealIngredient(mealId: number, productId: number, grams: number) {
    const statement = db.prepareSync(
        'INSERT INTO meal_ingredients (meal_id, product_id, grams) VALUES (?, ?, ?)'
    );
    statement.executeSync([mealId, productId, grams]);
}

export function updateMeal(id: number, name: string, isFavorite: number) {
    const statement = db.prepareSync(
        'UPDATE meals SET name = ?, is_favorite = ? WHERE id = ?'
    );
    statement.executeSync([name, isFavorite, id]);
}

export function getMealById(id: number): Meal | null {
    return db.getFirstSync<Meal>('SELECT * FROM meals WHERE id = ?', [id]);
}

export function deleteMealIngredients(mealId: number) {
    const statement = db.prepareSync('DELETE FROM meal_ingredients WHERE meal_id = ?');
    statement.executeSync([mealId]);
}

export function getMealIngredientsWithProducts(mealId: number) {
    const rows = db.getAllSync<Product & { grams: number }>(
        'SELECT mi.grams, p.* FROM meal_ingredients mi JOIN products p ON mi.product_id = p.id WHERE mi.meal_id = ?',
        [mealId]
    );

    return rows.map(row => {
        const { grams, ...product } = row;
        return {
            product: product as Product,
            grams: String(grams)
        };
    });
}

export function deleteMeal(id: number) {
    const statement = db.prepareSync('DELETE FROM meals WHERE id = ?');
    statement.executeSync([id]);
}
