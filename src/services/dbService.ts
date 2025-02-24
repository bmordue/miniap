import { Actor, OrderedCollection, Note, FollowerWithVisibility, DeliveryFailure } from '../types';
import { Database } from 'sqlite';
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
    return await this.db.get('SELECT * FROM actors WHERE preferredUsername = ?', [username]) || null;
  }

  public async getFollowersFromDB(username: string): Promise<OrderedCollection | null> {
    return await this.db.get('SELECT * FROM followers WHERE username = ?', [username]) || null;
  }

  public async getFollowingFromDB(username: string): Promise<OrderedCollection | null> {
    return await this.db.get('SELECT * FROM following WHERE username = ?', [username]) || null;
  }

  public async getOutboxFromDB(username: string): Promise<OrderedCollection | null> {
    return await this.db.get('SELECT * FROM outbox WHERE username = ?', [username]) || null;
  }

  public async getNoteFromDB(username: string): Promise<Note | null> {
    return await this.db.get('SELECT * FROM notes WHERE username = ?', [username]) || null;
  }

  public async addFollowerToDB(username: string, follower: string): Promise<void> {
    await this.db.run('INSERT INTO followers (username, follower) VALUES (?, ?)', [username, follower]);
  }

  public async getFollowersWithVisibilityFromDB (username: string): Promise<FollowerWithVisibility[] | null> {
    return await this.db.all('SELECT * FROM followers WHERE username = ?', [username]);
  }

  public async logDeliveryFailure(username: string, serialisedActivity: string, error: string): Promise<void> {
    await this.db.run('INSERT INTO delivery_failures (username, activityId, error) VALUES (?, ?, ?)', [username, serialisedActivity, error]);
  }

  public async getDeliveryFailures(username: string): Promise<DeliveryFailure[] | null> {
    return await this.db.all('SELECT * FROM delivery_failures WHERE username = ?', [username]);
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

export default DbService;
