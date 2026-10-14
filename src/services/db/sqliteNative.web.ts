// Web fallback: returns null and avoids importing expo-sqlite during web bundling/export
export function getNativeDatabase(_dbName: string): null {
  return null;
}

export type NativeDatabase = any;
