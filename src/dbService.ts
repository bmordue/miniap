import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Actor, OrderedCollection, Note, FollowerWithVisibility, DeliveryFailure } from './types';

const dbPromise = open({
  filename: process.env.DB_FILENAME || 'activitypub.db',
  driver: sqlite3.Database
});

export const getActorFromDB = async (username: string): Promise<Actor | null> => {
  const db = await dbPromise;
  const res = await db.get('SELECT * FROM actors WHERE preferredUsername = ?', [username]);
  if (!res) {
    return null;
  }
  return res;
};

export const getFollowersFromDB = async (username: string): Promise<OrderedCollection | null> => {
  const db = await dbPromise;
  const res = await db.get('SELECT * FROM followers WHERE username = ?', [username]);
  if (!res) {
    return null;
  }
  return res;
};

export const getFollowingFromDB = async (username: string): Promise<OrderedCollection | null> => {
  const db = await dbPromise;
  const res = await db.get('SELECT * FROM following WHERE username = ?', [username]);
  if (!res) {
    return null;
  }
  return res;
};

export const getOutboxFromDB = async (username: string): Promise<OrderedCollection | null> => {
  const db = await dbPromise;
  const res = await db.get('SELECT * FROM outbox WHERE username = ?', [username]);
  if (!res) {
    return null;
  }
  return res;
};

export const getNoteFromDB = async (username: string): Promise<Note | null> => {
  const db = await dbPromise;
  const res = await db.get('SELECT * FROM notes WHERE username = ?', [username]);
  if (!res) {
    return null;
  }
  return res;
};

export const addFollowerToDB = async (username: string, follower: string): Promise<void> => {
  const db = await dbPromise;
  await db.run('INSERT INTO followers (username, follower) VALUES (?, ?)', [username, follower]);
};

export const getFollowersWithVisibilityFromDB = async (username: string): Promise<FollowerWithVisibility[] | null> => {
  const db = await dbPromise;
  const res = await db.all('SELECT * FROM followers WHERE username = ?', [username]);
  if (!res) {
    return null;
  }
  return res;
};

export async function logDeliveryFailure(username: string, serialisedActivity: string, error: string): Promise<void> {
  const db = await dbPromise;
  await db.run('INSERT INTO delivery_failures (username, activityId, error) VALUES (?, ?, ?)', [username, serialisedActivity, error]);
}

export const getDeliveryFailures = async (username: string): Promise<DeliveryFailure[] | null> => {
  const db = await dbPromise;
  const res = await db.all('SELECT * FROM delivery_failures WHERE username = ?', [username]);
  if (!res) {
    return null;
  }
  return res;
};

export const addNoteToDB = async (note: Note): Promise<void> => {
  const db = await dbPromise;
  await db.run(
    'INSERT INTO notes (id, attributedTo, content, published, to) VALUES (?, ?, ?, ?, ?)',
    [note.id, note.attributedTo, note.content, note.published, JSON.stringify(note.to)]
  );
};

export const updateNoteInDB = async (note: Note): Promise<void> => {
  const db = await dbPromise;
  await db.run(
    'UPDATE notes SET content = ?, published = ?, to = ? WHERE id = ?',
    [note.content, note.published, JSON.stringify(note.to), note.id]
  );
};

export const deleteNoteFromDB = async (noteId: string): Promise<void> => {
  const db = await dbPromise;
  await db.run('DELETE FROM notes WHERE id = ?', [noteId]);
};
