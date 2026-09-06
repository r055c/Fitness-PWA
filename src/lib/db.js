import { openDB } from 'idb';

const DB_NAME = 'fitfive';
const DB_VERSION = 1;

let dbPromise;

function open() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(database) {
        database.createObjectStore('meta', { keyPath: 'key' });

        const weight = database.createObjectStore('weightEntries', { keyPath: 'id' });
        weight.createIndex('loggedAt', 'loggedAt');

        database.createObjectStore('sessions', { keyPath: 'id' });

        const sets = database.createObjectStore('setLogs', { keyPath: 'id' });
        sets.createIndex('sessionId', 'sessionId');
        sets.createIndex('exerciseId', 'exerciseId');

        database.createObjectStore('personalBests', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

export function uid() {
  return crypto.randomUUID();
}

export async function getAll(store) {
  return (await open()).getAll(store);
}

export async function getOne(store, key) {
  return (await open()).get(store, key);
}

export async function put(store, value) {
  await (await open()).put(store, value);
  return value;
}

export async function remove(store, key) {
  await (await open()).delete(store, key);
}

export async function getAllByIndex(store, index, value) {
  return (await open()).getAllFromIndex(store, index, value);
}
