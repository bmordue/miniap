import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { Actor, OrderedCollection, Note } from './types';
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
      'INSERT INTO notes (id, attributedTo, content, published, to) VALUES (?, ?, ?, ?, ?)',
      [note.id, note.attributedTo, note.content, note.published, JSON.stringify(note.to)]
    );
  }

  public async updateNoteInDB(note: Note): Promise<void> {
    await this.db.run(
      'UPDATE notes SET content = ?, published = ?, to = ? WHERE id = ?',
      [note.content, note.published, JSON.stringify(note.to), note.id]
    );
  }

  public async deleteNoteFromDB(noteId: string): Promise<void> {
    await this.db.run('DELETE FROM notes WHERE id = ?', [noteId]);
  }
}

export default DbService;
