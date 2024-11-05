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

// Add mentions and notifications table creation queries
const createMentionsTable = async () => {
  const db = await dbPromise;
  await db.run(`
    CREATE TABLE IF NOT EXISTS mentions (
      id UUID PRIMARY KEY,
      post_id UUID NOT NULL,
      mentioned_actor_id TEXT NOT NULL,
      mentioner_id TEXT NOT NULL,
      position INT,
      created_at TIMESTAMP NOT NULL,
      FOREIGN KEY (post_id) REFERENCES posts(id)
    )
  `);
};

const createNotificationsTable = async () => {
  const db = await dbPromise;
  await db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY,
      actor_id TEXT NOT NULL,
      type TEXT NOT NULL,
      originating_actor_id TEXT NOT NULL,
      reference_id TEXT NOT NULL,
      seen BOOLEAN DEFAULT false,
      created_at TIMESTAMP NOT NULL,
      data JSONB
    )
  `);
};

// Add store_mention function
export const storeMention = async (post_id: string, mentioned_actor: string, mentioner: string): Promise<void> => {
  const db = await dbPromise;
  await db.run(
    'INSERT INTO mentions (id, post_id, mentioned_actor_id, mentioner_id, created_at) VALUES (?, ?, ?, ?, NOW())',
    [uuid.v4(), post_id, mentioned_actor, mentioner]
  );
};

// Add create_notification function
export const createNotification = async (actor_id: string, type: string, originating_actor: string, reference: string, data: any = null): Promise<void> => {
  const db = await dbPromise;
  await db.run(
    'INSERT INTO notifications (id, actor_id, type, originating_actor_id, reference_id, created_at, data) VALUES (?, ?, ?, ?, ?, NOW(), ?)',
    [uuid.v4(), actor_id, type, originating_actor, reference, data]
  );
};
