import {
  Actor,
  OrderedCollection,
  Note,
  FollowerWithVisibility,
  DeliveryFailure,
} from "../types";
import { Database } from "sqlite";
import fs from "fs";
import path from "path";
import * as uuid from "uuid";

class DbService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
    this.initializeDatabase().catch((error) => {
      console.error("Error initializing database:", error);
    });
  }

  private async initializeDatabase(): Promise<void> {
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");
    await this.db.exec(schema);
  }

  public async getActorFromDB(username: string): Promise<Actor | null> {
    return (
      (await this.db.get("SELECT * FROM actors WHERE preferredUsername = ?", [
        username,
      ])) || null
    );
  }

  public async getFollowersFromDB(
    username: string
  ): Promise<OrderedCollection | null> {
    return (
      (await this.db.get("SELECT * FROM followers WHERE username = ?", [
        username,
      ])) || null
    );
  }

  public async getFollowingFromDB(
    username: string
  ): Promise<OrderedCollection | null> {
    return (
      (await this.db.get("SELECT * FROM following WHERE username = ?", [
        username,
      ])) || null
    );
  }

  public async getOutboxFromDB(
    username: string
  ): Promise<OrderedCollection | null> {
    return (
      (await this.db.get("SELECT * FROM outbox WHERE username = ?", [
        username,
      ])) || null
    );
  }

  public async getNoteFromDB(username: string): Promise<Note | null> {
    return (
      (await this.db.get("SELECT * FROM notes WHERE username = ?", [
        username,
      ])) || null
    );
  }

  public async addFollowerToDB(
    username: string,
    follower: string
  ): Promise<void> {
    await this.db.run(
      "INSERT INTO followers (username, follower) VALUES (?, ?)",
      [username, follower]
    );
  }

  public async getFollowersWithVisibilityFromDB(
    username: string
  ): Promise<FollowerWithVisibility[] | null> {
    return await this.db.all("SELECT * FROM followers WHERE username = ?", [
      username,
    ]);
  }

  public async logDeliveryFailure(
    username: string,
    serialisedActivity: string,
    error: string
  ): Promise<void> {
    await this.db.run(
      "INSERT INTO delivery_failures (username, activityId, error) VALUES (?, ?, ?)",
      [username, serialisedActivity, error]
    );
  }

  public async getDeliveryFailures(
    username: string
  ): Promise<DeliveryFailure[] | null> {
    return await this.db.all(
      "SELECT * FROM delivery_failures WHERE username = ?",
      [username]
    );
  }

  public async addNoteToDB(note: Note): Promise<void> {
    await this.db.run(
      "INSERT INTO notes (id, attributedTo, content, published, to, visibility) VALUES (?, ?, ?, ?, ?, ?)",
      [
        note.id,
        note.attributedTo,
        note.content,
        note.published,
        JSON.stringify(note.to),
        note.visibility,
      ]
    );
  }

  public async updateNoteInDB(note: Note): Promise<void> {
    await this.db.run(
      "UPDATE notes SET content = ?, published = ?, to = ?, visibility = ? WHERE id = ?",
      [
        note.content,
        note.published,
        JSON.stringify(note.to),
        note.visibility,
        note.id,
      ]
    );
  }

  public async deleteNoteFromDB(noteId: string): Promise<void> {
    await this.db.run("DELETE FROM notes WHERE id = ?", [noteId]);
  }

  // Add likes table
  public async addLikeToDB(
    actorId: string,
    objectId: string,
    activityId: string
  ): Promise<void> {
    await this.db.run(
      "INSERT INTO likes (id, actor_id, object_id, activity_id, created_at) VALUES (?, ?, ?, ?, ?)",
      [activityId, actorId, objectId, activityId, new Date().toISOString()]
    );
  }

  public async removeLikeFromDB(
    actorId: string,
    objectId: string
  ): Promise<void> {
    await this.db.run(
      "DELETE FROM likes WHERE actor_id = ? AND object_id = ?",
      [actorId, objectId]
    );
  }

  // Add announces table
  public async addAnnounceToDB(
    actorId: string,
    objectId: string,
    activityId: string
  ): Promise<void> {
    await this.db.run(
      "INSERT INTO announces (id, actor_id, object_id, activity_id, created_at) VALUES (?, ?, ?, ?, ?)",
      [activityId, actorId, objectId, activityId, new Date().toISOString()]
    );
  }

  public async removeAnnounceFromDB(
    actorId: string,
    objectId: string
  ): Promise<void> {
    await this.db.run(
      "DELETE FROM announces WHERE actor_id = ? AND object_id = ?",
      [actorId, objectId]
    );
  }

  // Add mentions and notifications table creation queries
  async createMentionsTable() {
    await this.db.run(`
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
  }

  async createNotificationsTable() {
    await this.db.run(`
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
  }

  // Add store_mention function
  public async storeMention(
    post_id: string,
    mentioned_actor: string,
    mentioner: string
  ): Promise<void> {
    await this.db.run(
      "INSERT INTO mentions (id, post_id, mentioned_actor_id, mentioner_id, created_at) VALUES (?, ?, ?, ?, NOW())",
      [uuid.v4(), post_id, mentioned_actor, mentioner]
    );
  }

  // Add create_notification function
  public async createNotification(
    actor_id: string,
    type: string,
    originating_actor: string,
    reference: string,
    data: any = null
  ): Promise<void> {
    await this.db.run(
      "INSERT INTO notifications (id, actor_id, type, originating_actor_id, reference_id, created_at, data) VALUES (?, ?, ?, ?, ?, NOW(), ?)",
      [uuid.v4(), actor_id, type, originating_actor, reference, data]
    );
  }
}

export default DbService;
