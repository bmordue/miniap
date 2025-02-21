import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { Actor, OrderedCollection, Note, VisibilityType } from './types';
import fs from 'fs';
import path from 'path';

class DbService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
    this.initializeDatabase().catch((error) => {
      console.error('Error initializing database:', error);
    });
  }

  private async initializeDatabase(): Promise<void> {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await this.db.exec(schema);
  }

  public async getActorFromDB(username: string): Promise<Actor | null> {
    const res = await this.db.get('SELECT * FROM actors WHERE preferredUsername = ?', [username]);
    if (!res) {
      return null;
    }
    return res;
  }

  public async getFollowersFromDB(username: string): Promise<OrderedCollection | null> {
    const res = await this.db.get('SELECT * FROM followers WHERE username = ?', [username]);
    if (!res) {
      return null;
    }
    return res;
  }

  public async getFollowingFromDB(username: string): Promise<OrderedCollection | null> {
    const res = await this.db.get('SELECT * FROM following WHERE username = ?', [username]);
    if (!res) {
      return null;
    }
    return res;
  }

  public async getOutboxFromDB(username: string): Promise<OrderedCollection | null> {
    const res = await this.db.get('SELECT * FROM outbox WHERE username = ?', [username]);
    if (!res) {
      return null;
    }
    return res;
  }

  public async getNoteFromDB(username: string): Promise<Note | null> {
    const res = await this.db.get('SELECT * FROM notes WHERE username = ?', [username]);
    if (!res) {
      return null;
    }
    return res;
  }

  public async addFollowerToDB(username: string, follower: string): Promise<void> {
    await this.db.run('INSERT INTO followers (username, follower) VALUES (?, ?)', [username, follower]);
  }

  public async addNoteToDB(note: Note): Promise<void> {
    await this.db.run(
      'INSERT INTO notes (id, attributedTo, content, published, to, visibility) VALUES (?, ?, ?, ?, ?, ?)',
    [note.id, note.attributedTo, note.content, note.published, JSON.stringify(note.to), note.visibility]
    );
  }

  public async updateNoteInDB(note: Note): Promise<void> {
    await this.db.run(
      'UPDATE notes SET content = ?, published = ?, to = ?, visibility = ? WHERE id = ?',
    [note.content, note.published, JSON.stringify(note.to), note.visibility, note.id]
    );
  }

  public async deleteNoteFromDB(noteId: string): Promise<void> {
    await this.db.run('DELETE FROM notes WHERE id = ?', [noteId]);
  }
}

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
