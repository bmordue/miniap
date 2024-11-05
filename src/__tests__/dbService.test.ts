import sqlite3 from "sqlite3";
import { open } from "sqlite";
import {
  addNoteToDB,
  updateNoteInDB,
  deleteNoteFromDB,
  getNoteFromDB,
  addLikeToDB,
  removeLikeFromDB,
  addAnnounceToDB,
  removeAnnounceFromDB,
} from "../dbService";
import { Note } from "../types";

// Mock the database modules
jest.mock("sqlite3");
jest.mock("sqlite", () => ({
  open: jest.fn(),
}));

// Create a mock database instance
const mockDb = {
  run: jest.fn(),
  get: jest.fn(),
};

// Mock the open function to return our mock database
(open as jest.Mock).mockResolvedValue(mockDb);

describe.skip("Database Note Operations", () => {
  let mockNote: Note;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    process.env.DB_FILENAME = ":memory:";

    // Reset mock implementations
    mockDb.run.mockResolvedValue(undefined);
    mockDb.get.mockResolvedValue({ id: "1" });

    mockNote = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "Note",
      id: "https://example.com/users/alice/notes/1",
      attributedTo: "https://example.com/users/alice",
      content: "Test content",
      published: "2023-01-01T00:00:00Z",
      to: ["https://www.w3.org/ns/activitystreams#Public"],
    };
  });

  describe("addNoteToDB", () => {
    it("should successfully add a note to the database", async () => {
      await addNoteToDB(mockNote);

      expect(mockDb.run).toHaveBeenCalledWith(
        "INSERT INTO notes (id, attributedTo, content, published, to) VALUES (?, ?, ?, ?, ?)",
        [
          mockNote.id,
          mockNote.attributedTo,
          mockNote.content,
          mockNote.published,
          JSON.stringify(mockNote.to),
        ],
      );
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      mockDb.run.mockRejectedValueOnce(error);

      await expect(addNoteToDB(mockNote)).rejects.toThrow("Database error");
    });
  });

  describe("updateNoteInDB", () => {
    it("should successfully update a note in the database", async () => {
      await updateNoteInDB(mockNote);

      expect(mockDb.run).toHaveBeenCalledWith(
        "UPDATE notes SET content = ?, published = ?, to = ? WHERE id = ?",
        [
          mockNote.content,
          mockNote.published,
          JSON.stringify(mockNote.to),
          mockNote.id,
        ],
      );
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      mockDb.run.mockRejectedValueOnce(error);

      await expect(updateNoteInDB(mockNote)).rejects.toThrow("Database error");
    });
  });

  describe("deleteNoteFromDB", () => {
    it("should successfully delete a note from the database", async () => {
      const noteId = "1";
      await deleteNoteFromDB(noteId);

      expect(mockDb.run).toHaveBeenCalledWith(
        "DELETE FROM notes WHERE id = ?",
        [noteId],
      );
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      mockDb.run.mockRejectedValueOnce(error);

      await expect(deleteNoteFromDB("1")).rejects.toThrow("Database error");
    });
  });

  describe("getNoteFromDB", () => {
    it("should successfully retrieve a note from the database", async () => {
      const username = "alice";
      const mockNoteData = { ...mockNote };
      mockDb.get.mockResolvedValueOnce(mockNoteData);

      const result = await getNoteFromDB(username);

      expect(mockDb.get).toHaveBeenCalledWith(
        "SELECT * FROM notes WHERE username = ?",
        [username],
      );
      expect(result).toEqual(mockNoteData);
    });

    it("should return null if note is not found", async () => {
      mockDb.get.mockResolvedValueOnce(null);

      const result = await getNoteFromDB("alice");

      expect(result).toBeNull();
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      mockDb.get.mockRejectedValueOnce(error);

      await expect(getNoteFromDB("alice")).rejects.toThrow("Database error");
    });
  });
});

describe("Database Like Operations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DB_FILENAME = ":memory:";
    mockDb.run.mockResolvedValue(undefined);
    mockDb.get.mockResolvedValue({ id: "1" });
  });

  describe("addLikeToDB", () => {
    it("should successfully add a like to the database", async () => {
      const actorId = "https://example.com/users/alice";
      const objectId = "https://example.com/users/bob/posts/1";
      const activityId = "https://example.com/users/alice/activities/1";

      await addLikeToDB(actorId, objectId, activityId);

      expect(mockDb.run).toHaveBeenCalledWith(
        "INSERT INTO likes (id, actor_id, object_id, activity_id, created_at) VALUES (?, ?, ?, ?, ?)",
        [activityId, actorId, objectId, activityId, expect.any(String)]
      );
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      mockDb.run.mockRejectedValueOnce(error);

      const actorId = "https://example.com/users/alice";
      const objectId = "https://example.com/users/bob/posts/1";
      const activityId = "https://example.com/users/alice/activities/1";

      await expect(addLikeToDB(actorId, objectId, activityId)).rejects.toThrow("Database error");
    });
  });

  describe("removeLikeFromDB", () => {
    it("should successfully remove a like from the database", async () => {
      const actorId = "https://example.com/users/alice";
      const objectId = "https://example.com/users/bob/posts/1";

      await removeLikeFromDB(actorId, objectId);

      expect(mockDb.run).toHaveBeenCalledWith(
        "DELETE FROM likes WHERE actor_id = ? AND object_id = ?",
        [actorId, objectId]
      );
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      mockDb.run.mockRejectedValueOnce(error);

      const actorId = "https://example.com/users/alice";
      const objectId = "https://example.com/users/bob/posts/1";

      await expect(removeLikeFromDB(actorId, objectId)).rejects.toThrow("Database error");
    });
  });
});

describe("Database Announce Operations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DB_FILENAME = ":memory:";
    mockDb.run.mockResolvedValue(undefined);
    mockDb.get.mockResolvedValue({ id: "1" });
  });

  describe("addAnnounceToDB", () => {
    it("should successfully add an announce to the database", async () => {
      const actorId = "https://example.com/users/alice";
      const objectId = "https://example.com/users/bob/posts/1";
      const activityId = "https://example.com/users/alice/activities/1";

      await addAnnounceToDB(actorId, objectId, activityId);

      expect(mockDb.run).toHaveBeenCalledWith(
        "INSERT INTO announces (id, actor_id, object_id, activity_id, created_at) VALUES (?, ?, ?, ?, ?)",
        [activityId, actorId, objectId, activityId, expect.any(String)]
      );
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      mockDb.run.mockRejectedValueOnce(error);

      const actorId = "https://example.com/users/alice";
      const objectId = "https://example.com/users/bob/posts/1";
      const activityId = "https://example.com/users/alice/activities/1";

      await expect(addAnnounceToDB(actorId, objectId, activityId)).rejects.toThrow("Database error");
    });
  });

  describe("removeAnnounceFromDB", () => {
    it("should successfully remove an announce from the database", async () => {
      const actorId = "https://example.com/users/alice";
      const objectId = "https://example.com/users/bob/posts/1";

      await removeAnnounceFromDB(actorId, objectId);

      expect(mockDb.run).toHaveBeenCalledWith(
        "DELETE FROM announces WHERE actor_id = ? AND object_id = ?",
        [actorId, objectId]
      );
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      mockDb.run.mockRejectedValueOnce(error);

      const actorId = "https://example.com/users/alice";
      const objectId = "https://example.com/users/bob/posts/1";

      await expect(removeAnnounceFromDB(actorId, objectId)).rejects.toThrow("Database error");
    });
  });
});
