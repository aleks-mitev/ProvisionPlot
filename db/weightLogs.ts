import * as SQLite from 'expo-sqlite';
import db from './database';

export interface WeightLog {
  id: number;
  weight: number;
  timestamp: string;
  context_tag: string;
}

export function getAllWeightLogs(): WeightLog[] {
  return db.getAllSync<WeightLog>('SELECT * FROM weight_logs ORDER BY timestamp DESC');
}

export function insertWeightLog(weight: number, timestamp: string, contextTag: string): number {
  const statement = db.prepareSync('INSERT INTO weight_logs (weight, timestamp, context_tag) VALUES (?, ?, ?)');
  const result = statement.executeSync([weight, timestamp, contextTag]);
  return result.lastInsertRowId;
}

export function updateWeightLog(id: number, weight: number, timestamp: string, contextTag: string) {
  const statement = db.prepareSync('UPDATE weight_logs SET weight = ?, timestamp = ?, context_tag = ? WHERE id = ?');
  statement.executeSync([weight, timestamp, contextTag, id]);
}

export function deleteWeightLog(id: number) {
  const statement = db.prepareSync('DELETE FROM weight_logs WHERE id = ?');
  statement.executeSync([id]);
}

export function getAllWeightContexts(): string[] {
  const rows = db.getAllSync<{ tag_name: string }>('SELECT tag_name FROM weight_contexts ORDER BY id ASC');
  return rows.map(r => r.tag_name);
}

export function insertWeightContext(tagName: string) {
  const statement = db.prepareSync('INSERT OR IGNORE INTO weight_contexts (tag_name) VALUES (?)');
  statement.executeSync([tagName]);
}

export function deleteWeightContext(tagName: string) {
  // Remove tag from logs that have it
  db.runSync("UPDATE weight_logs SET context_tag = '' WHERE context_tag = ?", [tagName]);

  // Delete tag
  db.runSync('DELETE FROM weight_contexts WHERE tag_name = ?', [tagName]);
}

export function renameWeightContext(oldName: string, newName: string) {
  const statement = db.prepareSync('UPDATE weight_contexts SET tag_name = ? WHERE tag_name = ?');
  statement.executeSync([newName, oldName]);

  const logStatement = db.prepareSync('UPDATE weight_logs SET context_tag = ? WHERE context_tag = ?');
  logStatement.executeSync([newName, oldName]);
}

export function initializeDefaultWeightContexts() {
  // Check exact value of the flag
  const flagRow = db.getFirstSync<{ setting_value: string }>(
    "SELECT setting_value FROM user_settings WHERE setting_key = 'weight_contexts_initialized'"
  );

  // If it is exactly 0, init default context tags
  if (flagRow && flagRow.setting_value === '0') {
    const defaultTags = ['Morning Empty Stomach', 'Post-Workout', 'Before Bed'];
    const statement = db.prepareSync('INSERT INTO weight_contexts (tag_name) VALUES (?)');

    for (const tag of defaultTags) {
      try {
        statement.executeSync([tag]);
      } catch (e) {
        // Silently ignore if it somehow already exists
      }
    }

    // Update flag to 1 so it never runs again
    db.runSync(
      "UPDATE user_settings SET setting_value = '1' WHERE setting_key = 'weight_contexts_initialized'"
    );
  }
}
