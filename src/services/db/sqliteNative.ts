import * as SQLite from 'expo-sqlite';

let sqliteDb: SQLite.SQLiteDatabase | null = null;

export function getNativeDatabase(dbName: string): SQLite.SQLiteDatabase {
  if (!sqliteDb) {
    sqliteDb = SQLite.openDatabaseSync(dbName);
  }
  return sqliteDb;
}

export type NativeDatabase = SQLite.SQLiteDatabase;
