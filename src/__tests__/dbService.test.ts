import { open } from "sqlite";
import {
  addNoteToDB,
  updateNoteInDB,
  deleteNoteFromDB,
  getNoteFromDB,
  getActorFromDB,
  getFollowersFromDB,
  getFollowingFromDB,
  getOutboxFromDB,
  addFollowerToDB,
} from "../dbService";
import { Note, Actor, OrderedCollection } from "../types";
import fs from "fs";
import path from "path";

// Mock the database modules
jest.mock("sqlite3");
jest.mock("sqlite", () => ({
  open: jest.fn(),
}));

// Create a mock database instance
const mockDb = {
  run: jest.fn(),
  get: jest.fn(),
  exec: jest.fn(),
};

// Mock the open function to return our mock database
(open as jest.Mock).mockResolvedValue(mockDb);

describe("Database Initialization", () => {
  it("should initialize the database with the correct schema", async () => {
    const schemaPath = path.join(__dirname, "../schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    await mockDb.exec(schema);

    expect(mockDb.exec).toHaveBeenCalledWith(schema);
  });
});

describe("Database Note Operations", () => {
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

describe("Database Actor Operations", () => {
  let mockActor: Actor;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    process.env.DB_FILENAME = ":memory:";

    // Reset mock implementations
    mockDb.run.mockResolvedValue(undefined);
    mockDb.get.mockResolvedValue({ id: "1" });

    mockActor = {
      "@context": ["https://www.w3.org/ns/activitystreams"],
      type: "Person",
      id: "https://example.com/users/alice",
      preferredUsername: "alice",
      name: "Alice",
      inbox: "https://example.com/users/alice/inbox",
      outbox: "https://example.com/users/alice/outbox",
      following: "https://example.com/users/alice/following",
      followers: "https://example.com/users/alice/followers",
    };
  });

  describe("getActorFromDB", () => {
    it("should successfully retrieve an actor from the database", async () => {
      const username = "alice";
      const mockActorData = { ...mockActor };
      mockDb.get.mockResolvedValueOnce(mockActorData);

      const result = await getActorFromDB(username);

      expect(mockDb.get).toHaveBeenCalledWith(
        "SELECT * FROM actors WHERE preferredUsername = ?",
        [username],
      );
      expect(result).toEqual(mockActorData);
    });

    it("should return null if actor is not found", async () => {
      mockDb.get.mockResolvedValueOnce(null);

      const result = await getActorFromDB("alice");

      expect(result).toBeNull();
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      mockDb.get.mockRejectedValueOnce(error);

      await expect(getActorFromDB("alice")).rejects.toThrow("Database error");
    });
  });
});

describe("Database Followers Operations", () => {
  let mockFollowers: OrderedCollection;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    process.env.DB_FILENAME = ":memory:";

    // Reset mock implementations
    mockDb.run.mockResolvedValue(undefined);
    mockDb.get.mockResolvedValue({ id: "1" });

    mockFollowers = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "OrderedCollection",
      totalItems: 1,
      orderedItems: [
        {
          type: "Person",
          id: "https://example.com/users/bob",
          preferredUsername: "bob",
          name: "Bob",
        },
      ],
    };
  });

  describe("getFollowersFromDB", () => {
    it("should successfully retrieve followers from the database", async () => {
      const username = "alice";
      const mockFollowersData = { ...mockFollowers };
      mockDb.get.mockResolvedValueOnce(mockFollowersData);

      const result = await getFollowersFromDB(username);

      expect(mockDb.get).toHaveBeenCalledWith(
        "SELECT * FROM followers WHERE username = ?",
        [username],
      );
      expect(result).toEqual(mockFollowersData);
    });

    it("should return null if followers are not found", async () => {
      mockDb.get.mockResolvedValueOnce(null);

      const result = await getFollowersFromDB("alice");

      expect(result).toBeNull();
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      mockDb.get.mockRejectedValueOnce(error);

      await expect(getFollowersFromDB("alice")).rejects.toThrow("Database error");
    });
  });

  describe("addFollowerToDB", () => {
    it("should successfully add a follower to the database", async () => {
      const username = "alice";
      const follower = "bob";

      await addFollowerToDB(username, follower);

      expect(mockDb.run).toHaveBeenCalledWith(
        "INSERT INTO followers (username, follower) VALUES (?, ?)",
        [username, follower],
      );
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      mockDb.run.mockRejectedValueOnce(error);

      await expect(addFollowerToDB("alice", "bob")).rejects.toThrow("Database error");
    });
  });
});

describe("Database Following Operations", () => {
  let mockFollowing: OrderedCollection;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    process.env.DB_FILENAME = ":memory:";

    // Reset mock implementations
    mockDb.run.mockResolvedValue(undefined);
    mockDb.get.mockResolvedValue({ id: "1" });

    mockFollowing = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "OrderedCollection",
      totalItems: 1,
      orderedItems: [
        {
          type: "Person",
          id: "https://example.com/users/charlie",
          preferredUsername: "charlie",
          name: "Charlie",
        },
      ],
    };
  });

  describe("getFollowingFromDB", () => {
    it("should successfully retrieve following from the database", async () => {
      const username = "alice";
      const mockFollowingData = { ...mockFollowing };
      mockDb.get.mockResolvedValueOnce(mockFollowingData);

      const result = await getFollowingFromDB(username);

      expect(mockDb.get).toHaveBeenCalledWith(
        "SELECT * FROM following WHERE username = ?",
        [username],
      );
      expect(result).toEqual(mockFollowingData);
    });

    it("should return null if following are not found", async () => {
      mockDb.get.mockResolvedValueOnce(null);

      const result = await getFollowingFromDB("alice");

      expect(result).toBeNull();
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      mockDb.get.mockRejectedValueOnce(error);

      await expect(getFollowingFromDB("alice")).rejects.toThrow("Database error");
    });
  });
});

describe("Database Outbox Operations", () => {
  let mockOutbox: OrderedCollection;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    process.env.DB_FILENAME = ":memory:";

    // Reset mock implementations
    mockDb.run.mockResolvedValue(undefined);
    mockDb.get.mockResolvedValue({ id: "1" });

    mockOutbox = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "OrderedCollection",
      totalItems: 1,
      orderedItems: [
        {
          type: "Create",
          id: "https://example.com/users/alice/notes/1",
          actor: "https://example.com/users/alice",
          published: "2023-01-01T00:00:00Z",
          to: ["https://www.w3.org/ns/activitystreams#Public"],
          object: {
            type: "Note",
            content: "Hello, World!",
          },
        },
      ],
    };
  });

  describe("getOutboxFromDB", () => {
    it("should successfully retrieve outbox from the database", async () => {
      const username = "alice";
      const mockOutboxData = { ...mockOutbox };
      mockDb.get.mockResolvedValueOnce(mockOutboxData);

      const result = await getOutboxFromDB(username);

      expect(mockDb.get).toHaveBeenCalledWith(
        "SELECT * FROM outbox WHERE username = ?",
        [username],
      );
      expect(result).toEqual(mockOutboxData);
    });

    it("should return null if outbox is not found", async () => {
      mockDb.get.mockResolvedValueOnce(null);

      const result = await getOutboxFromDB("alice");

      expect(result).toBeNull();
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      mockDb.get.mockRejectedValueOnce(error);

      await expect(getOutboxFromDB("alice")).rejects.toThrow("Database error");
    });
  });
});
