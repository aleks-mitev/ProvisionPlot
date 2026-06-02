import db from './database';

export type Product = {
    id: number;
    name: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    sugar: number;
    fibre: number;
    brand?: string;
    packet_size?: number;
    price?: number;
    is_favorite: number;
};

export function insertProduct(
    name: string,
    calories: number,
    protein: number,
    fat: number,
    carbs: number,
    sugar: number,
    fibre: number,
    brand: string,
    packetSize: number,
    price: number,
    isFavorite: number
) {
    const statement = db.prepareSync(
        `INSERT INTO products (name, calories, protein, fat, carbs, sugar, fibre, brand, packet_size, price, is_favorite) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    statement.executeSync([
        name, calories, protein, fat, carbs, sugar, fibre, brand, packetSize, price, isFavorite
    ]);
}

export function getAllProducts(): Product[] {
    return db.getAllSync<Product>('SELECT * FROM products ORDER BY name ASC');
}

export function getProductById(id: number): Product | null {
    return db.getFirstSync<Product>('SELECT * FROM products WHERE id = ?', [id]);
}

export function updateProduct(
    id: number,
    name: string,
    calories: number,
    protein: number,
    fat: number,
    carbs: number,
    sugar: number,
    fibre: number,
    brand: string,
    packetSize: number,
    price: number,
    isFavorite: number
) {
    const statement = db.prepareSync(
        `UPDATE products SET name = ?, calories = ?, protein = ?, fat = ?, carbs = ?, sugar = ?, fibre = ?, brand = ?, packet_size = ?, price = ?, is_favorite = ? WHERE id = ?`
    );

    statement.executeSync([
        name, calories, protein, fat, carbs, sugar, fibre, brand, packetSize, price, isFavorite, id
    ]);
}

export function deleteProduct(id: number) {
    const statement = db.prepareSync('DELETE FROM products WHERE id = ?');
    statement.executeSync([id]);
}
