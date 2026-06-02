import * as SQLite from 'expo-sqlite';
import db from './database';

export interface FastRecord {
    id: number;
    start_time: string;
    end_time: string | null;
    target_hours: number | null;
}

export function insertFast(startTime: string, targetHours: number | null): number {
    const statement = db.prepareSync('INSERT INTO fasts (start_time, end_time, target_hours) VALUES (?, NULL, ?)');
    const result = statement.executeSync([startTime, targetHours]);
    return result.lastInsertRowId;
}

export function updateFastEnd(id: number, endTime: string) {
    const statement = db.prepareSync('UPDATE fasts SET end_time = ? WHERE id = ?');
    statement.executeSync([endTime, id]);
}

export function updateFastTarget(id: number, targetHours: number | null) {
    const statement = db.prepareSync('UPDATE fasts SET target_hours = ? WHERE id = ?');
    statement.executeSync([targetHours, id]);
}

export function updateFastStart(id: number, startTime: string) {
    const statement = db.prepareSync('UPDATE fasts SET start_time = ? WHERE id = ?');
    statement.executeSync([startTime, id]);
}

export function deleteFast(id: number) {
    const statement = db.prepareSync('DELETE FROM fasts WHERE id = ?');
    statement.executeSync([id]);
}

export function getActiveFast(): FastRecord | null {
    return db.getFirstSync<FastRecord>('SELECT * FROM fasts WHERE end_time IS NULL LIMIT 1');
}

export function getPastFasts(): FastRecord[] {
    return db.getAllSync<FastRecord>('SELECT * FROM fasts WHERE end_time IS NOT NULL ORDER BY start_time DESC');
}
