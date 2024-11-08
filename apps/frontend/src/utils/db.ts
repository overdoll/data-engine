import { openDB, DBSchema } from 'idb';

interface FileMetadata {
  id: string;
  fileName: string;
  uploadDate: Date;
}

interface FileDB extends DBSchema {
  files: {
    key: string;
    value: FileMetadata;
    indexes: { 'by-date': Date };
  };
}

const DB_NAME = 'dataset-manager';
const STORE_NAME = 'files';

export async function initDB() {
  return openDB<FileDB>(DB_NAME, 1, {
    upgrade(db) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      store.createIndex('by-date', 'uploadDate');
    },
  });
}

export async function addFile(fileMetadata: FileMetadata) {
  const db = await initDB();
  await db.put(STORE_NAME, fileMetadata);
}

export async function getFiles(): Promise<FileMetadata[]> {
  const db = await initDB();
  return db.getAllFromIndex(STORE_NAME, 'by-date');
} 