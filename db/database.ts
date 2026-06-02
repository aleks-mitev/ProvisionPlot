import * as SQLite from 'expo-sqlite';

// Opens the local database file (and creates it if it doesn't exist yet)
const db = SQLite.openDatabaseSync('provisionplot.db');

export async function initDatabase() {
    try {
        // Execute all table creations in one synchronous transaction
        await db.execAsync(`
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS products (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                name                TEXT    NOT NULL,
                calories            REAL    NOT NULL DEFAULT 0,
                protein             REAL    NOT NULL DEFAULT 0,
                fat                 REAL    NOT NULL DEFAULT 0,
                carbs               REAL    NOT NULL DEFAULT 0,
                sugar               REAL    NOT NULL DEFAULT 0,
                fibre               REAL    NOT NULL DEFAULT 0,
                brand               TEXT,
                packet_size         REAL,
                price               REAL,
                is_favorite         INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS meals (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                name                TEXT    NOT NULL,
                is_favorite         INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS meal_ingredients (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                meal_id             INTEGER NOT NULL,
                product_id          INTEGER NOT NULL,
                grams               REAL    NOT NULL DEFAULT 0,
                FOREIGN KEY (meal_id)    REFERENCES meals(id)    ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS daily_logs (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                date                TEXT    NOT NULL,
                reference_id        INTEGER NOT NULL,
                type                TEXT    NOT NULL,
                grams_consumed      INTEGER NOT NULL,
                calculated_calories INTEGER NOT NULL,
                calculated_protein  REAL    NOT NULL,
                parent_log_id       INTEGER DEFAULT NULL
            );

            CREATE TABLE IF NOT EXISTS fasts (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                start_time          TEXT    NOT NULL,
                end_time            TEXT,
                target_hours        REAL
            );

            CREATE TABLE IF NOT EXISTS weight_logs (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                weight              REAL    NOT NULL,
                timestamp           TEXT    NOT NULL,
                context_tag         TEXT    NOT NULL
            );

            CREATE TABLE IF NOT EXISTS weight_contexts (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                tag_name            TEXT    UNIQUE NOT NULL
            );

            CREATE TABLE IF NOT EXISTS user_settings (
                setting_key         TEXT    PRIMARY KEY,
                setting_value       TEXT    NOT NULL
            );
        `);

        await db.runAsync('INSERT OR IGNORE INTO user_settings (setting_key, setting_value) VALUES (?, ?)', ['target_calories', '0']);
        await db.runAsync('INSERT OR IGNORE INTO user_settings (setting_key, setting_value) VALUES (?, ?)', ['target_protein', '0']);
        await db.runAsync('INSERT OR IGNORE INTO user_settings (setting_key, setting_value) VALUES (?, ?)', ['weight_contexts_initialized', '0']);

        console.log("Database initialized successfully.");
    } catch (error) {
        console.error("Error initializing database:", error);
    }
}

export default db;
