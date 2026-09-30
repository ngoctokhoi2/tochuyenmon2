/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// IndexedDB Persistent Storage for long-term document & app data storage
const DB_NAME = 'TanThanh_Khoi5_Database';
const DB_VERSION = 2;
const STORE_NAME = 'app_data_store';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

export async function savePersistentData<T>(key: string, data: T): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const putRequest = store.put(data, key);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    });
  } catch (err) {
    console.warn(`[PersistentStorage] Falling back to localStorage for ${key}`, err);
    try {
      localStorage.setItem(`tanthanh_k5_${key}`, JSON.stringify(data));
    } catch (lsErr) {
      console.error(`[PersistentStorage] LocalStorage quota exceeded`, lsErr);
    }
  }
}

export async function loadPersistentData<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(key);

      getRequest.onsuccess = () => {
        if (getRequest.result !== undefined && getRequest.result !== null) {
          resolve(getRequest.result as T);
        } else {
          // Check localStorage as migration fallback
          const lsData = localStorage.getItem(`tanthanh_k5_${key}`);
          if (lsData) {
            try {
              const parsed = JSON.parse(lsData);
              resolve(parsed as T);
              return;
            } catch {
              // Ignore
            }
          }
          resolve(defaultValue);
        }
      };

      getRequest.onerror = () => {
        resolve(defaultValue);
      };
    });
  } catch {
    const lsData = localStorage.getItem(`tanthanh_k5_${key}`);
    if (lsData) {
      try {
        return JSON.parse(lsData) as T;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  }
}

export async function clearAllPersistentData(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  } catch (err) {
    console.error('Failed to clear IndexedDB', err);
  }
}

export async function exportAllDataToJson(): Promise<string> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const cursorRequest = store.openCursor();
    const backup: Record<string, any> = {};

    cursorRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        backup[cursor.key as string] = cursor.value;
        cursor.continue();
      } else {
        backup['_backup_date'] = new Date().toISOString();
        backup['_school'] = 'Trường Tiểu Học Mỹ Thạnh - Tổ Khối 2';
        resolve(JSON.stringify(backup, null, 2));
      }
    };

    cursorRequest.onerror = () => reject(cursorRequest.error);
  });
}

export async function downloadBackupFile(): Promise<void> {
  try {
    const jsonStr = await exportAllDataToJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `SaoLuu_ToKhoi2_MyThanh_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export and download backup:', err);
  }
}

export async function importDataFromJson(jsonStr: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonStr);
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      for (const [key, value] of Object.entries(data)) {
        if (!key.startsWith('_')) {
          store.put(value, key);
        }
      }

      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (e) {
    console.error('Import failed', e);
    return false;
  }
}
