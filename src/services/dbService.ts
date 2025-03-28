import {
  Actor,
  OrderedCollection,
  Note,
  FollowerWithVisibility,
  DeliveryFailure,
} from "../types";
import fs from "fs";
import path from "path";
import * as uuid from "uuid";
import { parse_mentions } from "./mentionService";
import { open, Database } from "sqlite";
import sqlite3 from "sqlite3";

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

  public static async open(filename: string | undefined) {
    return await open({
      filename: filename ?? ":memory:",
      driver: sqlite3.Database,
    });
  }

  public async addActor(actor: Actor): Promise<void> {
    await this.db.run(
      "INSERT INTO actors (id, preferredUsername, name, inbox, outbox, following, followers) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        actor.id,
        actor.preferredUsername,
        actor.name,
        actor.inbox,
        actor.outbox,
        actor.following,
        actor.followers,
      ]
    );
  }

  public async getActorFromDB(username: string): Promise<Actor | null> {
    const result = await this.db.get(
      "SELECT * FROM actors WHERE preferredUsername = ?",
      [username]
    );
    if (!result) {
      return null;
    }
    result["@context"] = "https://www.w3.org/ns/activitystreams";

    result.type = "Person";
    return result;
  }

  public async getFollowersFromDB(
    username: string
  ): Promise<OrderedCollection | null> {
    const result = await this.db.get("SELECT * FROM followers WHERE username = ?", [
        username,
      ]);
    if (!result) {
      return null;
    }
    
    // let response = {
    //   "@context": "https://www.w3.org/ns/activitystreams",
    //   "orderedItems": Array [
    //     Object {
    //       "id": "https://example.com/users/bob",
    //       "name": "Bob",
    //       "preferredUsername": "bob",
    //       "type": "Person",
    //     },
    //   ],
    //   "totalItems": 1,
    //   "type": "OrderedCollection",
  
    // };
    return result;
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
    const result = await this.db.get(
      "SELECT * FROM notes WHERE attributedTo = ?",
      [username]
    );
    if (!result) {
      return null;
    }
    result["@context"] = "https://www.w3.org/ns/activitystreams";
    result.type = "Note";
    result.to = JSON.parse(result.toActor);
    delete result.toActor;
    return result;
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
      "INSERT INTO notes (id, attributedTo, content, published, toActor, visibility) VALUES (?, ?, ?, ?, ?, ?)",
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
      "UPDATE notes SET content = ?, published = ?, toActor = ?, visibility = ? WHERE id = ?",
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

  public async create_notification(
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

  public async process_activity_for_notifications(
    activity: any
  ): Promise<void> {
    if (activity.type === "Create") {
      const mentions = parse_mentions(activity.object.content);
      for (const mention of mentions) {
        await this.create_notification(
          activity.object.content.id,
          "mention",
          activity.actor,
          activity.id,
          { content: activity.object.content }
        );
      }

      if (activity.inReplyTo) {
        const original_post = await this.getNoteFromDB(
          activity.object.inReplyTo
        );
        if (!original_post) {
          return;
        }
        await this.create_notification(
          original_post.attributedTo,
          "reply",
          activity.actor,
          activity.id
        );
      }
    }
  }

  public async get_notifications(
    actor_id: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    return await this.db.all(
      "SELECT * FROM notifications WHERE actor_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [actor_id, limit, offset]
    );
  }

  public async mark_notifications_as_read(
    notification_ids: string[],
    actor_id: string
  ): Promise<void> {
    await this.db.run(
      "UPDATE notifications SET seen = true WHERE id = ANY(?) AND actor_id = ?",
      [notification_ids, actor_id]
    );
  }

    // Add threading fields to posts table
  public async addThreadingFieldsToPostsTable(): Promise<void> {
    await this.db.run(`
    ALTER TABLE posts
    ADD COLUMN in_reply_to_id UUID,
    ADD COLUMN root_post_id UUID,
    ADD COLUMN thread_depth INT DEFAULT 0,
    ADD COLUMN replies_count INT DEFAULT 0,
    ADD FOREIGN KEY (in_reply_to_id) REFERENCES posts(id),
    ADD FOREIGN KEY (root_post_id) REFERENCES posts(id)
  `);
  }

  // Add thread_participants table
  public async addThreadParticipantsTable(): Promise<void> {
    await this.db.run(`
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
  }

  // Add indexes for efficient thread lookups
  public async addThreadLookupIndexes(): Promise<void> {
    await this.db.run(`
    CREATE INDEX posts_thread_lookup ON posts (root_post_id, created_at);
    CREATE INDEX posts_reply_lookup ON posts (in_reply_to_id, created_at);
  `);
  }
}

export default DbService;
