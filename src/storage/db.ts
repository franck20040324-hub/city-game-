/**
 * Local IndexedDB & LocalStorage Engine for MetroGenesis 3D
 * Supports offline storage, auto-resume on device boot,
 * and persistent storage of user-imported device audio files.
 */

import { GridTile, PlacedStructure, CityStats, Mission, CitizenEvent, GameSettings, CustomTrack } from '../types/game';

const DB_NAME = 'MetroGenesis3D_DB';
const DB_VERSION = 1;
const STORE_GAME = 'game_state';
const STORE_TRACKS = 'audio_tracks';
const LOCAL_STORAGE_BACKUP_KEY = 'metrogenesis_save_backup';

export interface FullGameState {
  version: number;
  savedAt: number;
  stats: CityStats;
  tiles: GridTile[];
  structures: PlacedStructure[];
  missions: Mission[];
  citizenEvents: CitizenEvent[];
  settings: GameSettings;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  dayTime: number; // 0 - 24
}

let dbInstance: IDBDatabase | null = null;

export async function initDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      console.warn('IndexedDB not supported, falling back to localStorage');
      resolve(null as unknown as IDBDatabase);
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_GAME)) {
        db.createObjectStore(STORE_GAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_TRACKS)) {
        db.createObjectStore(STORE_TRACKS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = (err) => {
      console.error('IndexedDB open error:', err);
      resolve(null as unknown as IDBDatabase);
    };
  });
}

/**
 * Saves current game state to IndexedDB and LocalStorage backup
 */
export async function saveGameState(state: FullGameState): Promise<boolean> {
  try {
    // 1. Always write lightweight JSON to localStorage for instant recovery
    try {
      localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(state));
    } catch {
      // localStorage may quota exceeded in private browsing
    }

    // 2. Write to IndexedDB
    const db = await initDatabase();
    if (!db) return true;

    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_GAME], 'readwrite');
      const store = transaction.objectStore(STORE_GAME);
      const record = { id: 'autosave', ...state };
      const request = store.put(record);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch (error) {
    console.error('Error saving game:', error);
    return false;
  }
}

/**
 * Automatically loads saved game from storage on phone/desktop startup
 */
export async function loadGameState(): Promise<FullGameState | null> {
  try {
    const db = await initDatabase();
    if (db) {
      const record = await new Promise<FullGameState | null>((resolve) => {
        try {
          const transaction = db.transaction([STORE_GAME], 'readonly');
          const store = transaction.objectStore(STORE_GAME);
          const request = store.get('autosave');

          request.onsuccess = () => {
            if (request.result) {
              const { id, ...state } = request.result;
              resolve(state as FullGameState);
            } else {
              resolve(null);
            }
          };
          request.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });

      if (record) return record;
    }

    // Fallback to localStorage backup
    const backupStr = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
    if (backupStr) {
      return JSON.parse(backupStr) as FullGameState;
    }
  } catch (e) {
    console.warn('Failed to load saved game:', e);
  }

  return null;
}

/**
 * Stores a user-imported audio track in IndexedDB so it is never lost on refresh
 */
export async function saveCustomAudioTrack(track: CustomTrack, fileBlob: Blob): Promise<boolean> {
  try {
    const db = await initDatabase();
    if (!db) return false;

    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_TRACKS], 'readwrite');
      const store = transaction.objectStore(STORE_TRACKS);
      const request = store.put({
        id: track.id,
        title: track.title,
        artist: track.artist,
        durationSec: track.durationSec,
        addedAt: track.addedAt,
        blob: fileBlob,
      });

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch (err) {
    console.error('Failed to store audio track:', err);
    return false;
  }
}

/**
 * Retrieves all stored user audio tracks
 */
export async function loadCustomAudioTracks(): Promise<{ track: CustomTrack; blob: Blob }[]> {
  try {
    const db = await initDatabase();
    if (!db) return [];

    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_TRACKS], 'readonly');
      const store = transaction.objectStore(STORE_TRACKS);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result || [];
        const result = records.map((r: any) => ({
          track: {
            id: r.id,
            title: r.title,
            artist: r.artist,
            durationSec: r.durationSec,
            addedAt: r.addedAt,
          },
          blob: r.blob as Blob,
        }));
        resolve(result);
      };
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Manually deletes a user audio track
 */
export async function deleteCustomAudioTrack(id: string): Promise<boolean> {
  try {
    const db = await initDatabase();
    if (!db) return false;

    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_TRACKS], 'readwrite');
      const store = transaction.objectStore(STORE_TRACKS);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}
