/**
 * Storage adapter for Supabase session persistence and local app caching.
 * Uses @react-native-async-storage/async-storage when available, with
 * fallback to localStorage or in-memory storage for web/offline testing.
 */

interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

const memoryStore = new Map<string, string>();

let nativeStorage: StorageAdapter | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  if (AsyncStorage) {
    nativeStorage = AsyncStorage;
  }
} catch {
  // Fall back to web localStorage or in-memory map
}

export const appStorage: StorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    if (nativeStorage) {
      try {
        return await nativeStorage.getItem(key);
      } catch {
        // Fall back
      }
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return memoryStore.get(key) ?? null;
  },

  async setItem(key: string, value: string): Promise<void> {
    if (nativeStorage) {
      try {
        await nativeStorage.setItem(key, value);
        return;
      } catch {
        // Fall back
      }
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
    memoryStore.set(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (nativeStorage) {
      try {
        await nativeStorage.removeItem(key);
        return;
      } catch {
        // Fall back
      }
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
      return;
    }
    memoryStore.delete(key);
  },
};

