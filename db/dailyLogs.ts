import * as SQLite from 'expo-sqlite';
import { DailyLogEntry } from '../store/dailyLogStore';
import db from './database';

export async function updateDailyLog(logId: number, grams: number, calories: number, protein: number) {
    return db.runAsync(
        'UPDATE daily_logs SET grams_consumed = ?, calculated_calories = ?, calculated_protein = ? WHERE id = ?',
        [grams, calories, protein, logId]
    );
}

export async function addDailyLog(logData: Omit<DailyLogEntry, 'id'>) {
    return db.runAsync(
        `INSERT INTO daily_logs (date, reference_id, type, grams_consumed, calculated_calories, calculated_protein, parent_log_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        logData.date, 
        logData.reference_id, 
        logData.type, 
        logData.grams_consumed, 
        logData.calculated_calories, 
        logData.calculated_protein,
        logData.parent_log_id || null
    );
}

export const addMealWithIngredients = async (mealLog: any, ingredientsLogs: any[]) => {
    const result = await db.runAsync(
        `INSERT INTO daily_logs (date, reference_id, type, grams_consumed, calculated_calories, calculated_protein, parent_log_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        mealLog.date,
        mealLog.reference_id,
        mealLog.type,
        mealLog.grams_consumed,
        mealLog.calculated_calories,
        mealLog.calculated_protein,
        null
    );

    const parent_log_id = result.lastInsertRowId;

    for (const ing of ingredientsLogs) {
        await addDailyLog({ ...ing, parent_log_id });
    }
};

export const updateMealWithIngredients = async (logId: number, mealData: any, ingredientsData: any[]) => {
    await db.runAsync(
        'UPDATE daily_logs SET grams_consumed = ?, calculated_calories = ?, calculated_protein = ? WHERE id = ?',
        [mealData.grams, mealData.calories, mealData.protein, logId]
    );

    await db.runAsync(
        'DELETE FROM daily_logs WHERE parent_log_id = ?',
        [logId]
    );

    for (const ing of ingredientsData) {
        await addDailyLog({ ...ing, parent_log_id: logId });
    }
};

export async function getLogsByDate(targetDate: string): Promise<DailyLogEntry[]> {
    return db.getAllAsync<DailyLogEntry>(
        `SELECT dl.*, COALESCE(p.name, m.name) as name FROM daily_logs dl LEFT JOIN products p ON dl.reference_id = p.id AND dl.type = 'product' LEFT JOIN meals m ON dl.reference_id = m.id AND dl.type = 'meal' WHERE dl.date = ?`,
        targetDate
    );
}

export async function deleteDailyLogEntry(logId: number) {
    return db.runAsync('DELETE FROM daily_logs WHERE id = ? OR parent_log_id = ?', [logId, logId]);
}
