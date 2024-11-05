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

// Add threading fields to posts table
export const addThreadingFieldsToPostsTable = async (): Promise<void> => {
  const db = await dbPromise;
  await db.run(`
    ALTER TABLE posts
    ADD COLUMN in_reply_to_id UUID,
    ADD COLUMN root_post_id UUID,
    ADD COLUMN thread_depth INT DEFAULT 0,
    ADD COLUMN replies_count INT DEFAULT 0,
    ADD FOREIGN KEY (in_reply_to_id) REFERENCES posts(id),
    ADD FOREIGN KEY (root_post_id) REFERENCES posts(id)
  `);
};

// Add thread_participants table
export const addThreadParticipantsTable = async (): Promise<void> => {
  const db = await dbPromise;
  await db.run(`
    CREATE TABLE thread_participants (
      thread_id UUID NOT NULL,
      actor_id TEXT NOT NULL,
      last_read_at TIMESTAMP,
      muted BOOLEAN DEFAULT false,
      created_at TIMESTAMP NOT NULL,
      PRIMARY KEY (thread_id, actor_id),
      FOREIGN KEY (thread_id) REFERENCES posts(id)
    )
  `);
};

// Add indexes for efficient thread lookups
export const addThreadLookupIndexes = async (): Promise<void> => {
  const db = await dbPromise;
  await db.run(`
    CREATE INDEX posts_thread_lookup ON posts (root_post_id, created_at);
    CREATE INDEX posts_reply_lookup ON posts (in_reply_to_id, created_at);
  `);
};
