import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

export interface ScoreEntry {
  id?: number;
  name: string;
  score: number;
  date: string;
}

// Fallback for Web if SQLite WASM has issues
const isWeb = Platform.OS === 'web';

let db: SQLite.SQLiteDatabase | null = null;

export const getDb = async () => {
  if (isWeb) return null; // We'll use localStorage for Web instead of SQLite if WASM is unstable

  if (db) return db;
  try {
    db = await SQLite.openDatabaseAsync('pong_scores.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        score INTEGER NOT NULL,
        date TEXT NOT NULL
      );
    `);
    return db;
  } catch (e) {
    console.error("SQLite opening error:", e);
    return null;
  }
};

export const saveScore = async (name: string, score: number) => {
  const date = new Date().toISOString();

  if (isWeb) {
    // Standard Web Persistence (localStorage)
    const existing = await getTopScores(100);
    const newData = [...existing, { id: Date.now(), name, score, date }];
    localStorage.setItem('pong_scores', JSON.stringify(newData));
    return;
  }

  const database = await getDb();
  if (database) {
    await database.runAsync('INSERT INTO scores (name, score, date) VALUES (?, ?, ?)', [name, score, date]);
  }
};

export const getTopScores = async (limit: number = 10): Promise<ScoreEntry[]> => {
  if (isWeb) {
    const data = localStorage.getItem('pong_scores');
    if (!data) return [];
    const parsed: ScoreEntry[] = JSON.parse(data);
    return parsed.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  const database = await getDb();
  if (!database) return [];

  const results = await database.getAllAsync<ScoreEntry>('SELECT * FROM scores ORDER BY score DESC LIMIT ?', [limit]);
  return results;
};
