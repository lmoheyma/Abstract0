import type { ChatMessage } from "@/hooks/useChatMessages";

const DB_NAME = "abstract0_db";
const DB_VERSION = 1;
const MESSAGES_STORE = "messages";

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("IndexedDB open error:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        const store = db.createObjectStore(MESSAGES_STORE, { keyPath: "projectId" });
        store.createIndex("projectId", "projectId", { unique: true });
      }
    };
  });
}

export async function loadMessagesFromDB(projectId: string): Promise<ChatMessage[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(MESSAGES_STORE, "readonly");
      const store = transaction.objectStore(MESSAGES_STORE);
      const request = store.get(projectId);

      request.onsuccess = () => {
        const result = request.result;
        if (result?.messages) {
          const messages = result.messages.map((m: ChatMessage) => ({
            ...m,
            isStreaming: false,
          }));
          resolve(messages);
        } else {
          resolve([]);
        }
      };

      request.onerror = () => {
        console.error("Error reading messages:", request.error);
        reject(request.error);
      };
    });
  } catch (e) {
    console.error("Error in loadMessagesFromDB:", e);
    return [];
  }
}

export async function saveMessagesToDB(projectId: string, messages: ChatMessage[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(MESSAGES_STORE, "readwrite");
      const store = transaction.objectStore(MESSAGES_STORE);
      const request = store.put({ projectId, messages, updatedAt: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error("Error saving messages:", request.error);
        reject(request.error);
      };
    });
  } catch (e) {
    console.error("Error in saveMessagesToDB:", e);
  }
}

export async function deleteMessagesFromDB(projectId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(MESSAGES_STORE, "readwrite");
      const store = transaction.objectStore(MESSAGES_STORE);
      const request = store.delete(projectId);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error("Error deleting messages:", request.error);
        reject(request.error);
      };
    });
  } catch (e) {
    console.error("Error in deleteMessagesFromDB:", e);
  }
}

export async function migrateFromLocalStorage(): Promise<void> {
  const MESSAGES_STORAGE_PREFIX = "abstract0_messages_";
  
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(MESSAGES_STORAGE_PREFIX));
    
    for (const key of keys) {
      const projectId = key.replace(MESSAGES_STORAGE_PREFIX, "");
      const stored = localStorage.getItem(key);
      
      if (stored) {
        const messages = JSON.parse(stored);
        await saveMessagesToDB(projectId, messages);
        localStorage.removeItem(key);
      }
    }
    
    if (keys.length > 0) {
      console.log(`IndexedDB migration: ${keys.length} projects migrated`);
    }
  } catch (e) {
    console.error("Error migrating from localStorage:", e);
  }
}
