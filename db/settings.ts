import { SQLiteDatabase } from 'expo-sqlite';
import db from './database';

export async function getAllSettings() {
    const rows = await db.getAllAsync<{ setting_key: string; setting_value: string }>('SELECT * FROM user_settings');
    return rows.reduce((acc, row) => ({ ...acc, [row.setting_key]: row.setting_value }), {} as Record<string, string>);
}

export async function updateSetting(key: string, value: string) {
    await db.runAsync('INSERT OR REPLACE INTO user_settings (setting_key, setting_value) VALUES (?, ?)', [key, String(value)]);
}
