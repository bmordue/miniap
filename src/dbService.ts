import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Actor, OrderedCollection, Note } from './types';

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

// Add likes table
export const addLikeToDB = async (actorId: string, objectId: string, activityId: string): Promise<void> => {
  const db = await dbPromise;
  await db.run(
    'INSERT INTO likes (id, actor_id, object_id, activity_id, created_at) VALUES (?, ?, ?, ?, ?)',
    [activityId, actorId, objectId, activityId, new Date().toISOString()]
  );
};

export const removeLikeFromDB = async (actorId: string, objectId: string): Promise<void> => {
  const db = await dbPromise;
  await db.run('DELETE FROM likes WHERE actor_id = ? AND object_id = ?', [actorId, objectId]);
};

// Add announces table
export const addAnnounceToDB = async (actorId: string, objectId: string, activityId: string): Promise<void> => {
  const db = await dbPromise;
  await db.run(
    'INSERT INTO announces (id, actor_id, object_id, activity_id, created_at) VALUES (?, ?, ?, ?, ?)',
    [activityId, actorId, objectId, activityId, new Date().toISOString()]
  );
};

export const removeAnnounceFromDB = async (actorId: string, objectId: string): Promise<void> => {
  const db = await dbPromise;
  await db.run('DELETE FROM announces WHERE actor_id = ? AND object_id = ?', [actorId, objectId]);
};
