import { Database, open } from "sqlite";
import DbService from "../dbService";
import { Note, Actor, OrderedCollection, VisibilityType } from "../../types";
import fs from "fs";
import path from "path";


// Mock the database modules
// jest.mock("sqlite3");
// jest.mock("sqlite", () => ({
//   open: jest.fn(),
// }));

// // Create a mock database instance
// const mockDb = {
//   run: jest.fn(),
//   get: jest.fn(),
//   exec: jest.fn(),
// };

const dbPromise = open({
  filename: ':memory:',
  driver: Database
});

// Mock the open function to return our mock database
// (open as jest.Mock).mockResolvedValue(mockDb);

describe.skip("Database Initialization", () => {
  it("should initialize the database with the correct schema", async () => {
    const schemaPath = path.join(__dirname, "../schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");


    const dbService = new DbService(await dbPromise);

    // expect(mockDb.exec).toHaveBeenCalledWith(schema);
  });
});

describe.skip("Database Note Operations", () => {
  let mockNote: Note;
  let dbService: DbService;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    process.env.DB_FILENAME = ":memory:";

    // Reset mock implementations
    // mockDb.run.mockResolvedValue(undefined);
    // mockDb.get.mockResolvedValue({ id: "1" });

    mockNote = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "Note",
      id: "https://example.com/users/alice/notes/1",
      attributedTo: "https://example.com/users/alice",
      content: "Test content",
      published: "2023-01-01T00:00:00Z",
      to: ["https://www.w3.org/ns/activitystreams#Public"],
      visibility: VisibilityType.Public,
    };

    dbService = new DbService(await dbPromise);
  });

  describe("addNoteToDB", () => {
    it("should successfully add a note to the database", async () => {
      await dbService.addNoteToDB(mockNote);

      // expect(mockDb.run).toHaveBeenCalledWith(
      //   "INSERT INTO notes (id, attributedTo, content, published, to, visibility) VALUES (?, ?, ?, ?, ?, ?)",
      //   [
      //     mockNote.id,
      //     mockNote.attributedTo,
      //     mockNote.content,
      //     mockNote.published,
      //     JSON.stringify(mockNote.to),
      //     mockNote.visibility,
      //   ],
      // );
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      // mockDb.run.mockRejectedValueOnce(error);

      await expect(dbService.addNoteToDB(mockNote)).rejects.toThrow("Database error");
    });
  });

  describe("updateNoteInDB", () => {
    it("should successfully update a note in the database", async () => {
      await dbService.updateNoteInDB(mockNote);

      // expect(mockDb.run).toHaveBeenCalledWith(
      //   "UPDATE notes SET content = ?, published = ?, to = ?, visibility = ? WHERE id = ?",
      //   [
      //     mockNote.content,
      //     mockNote.published,
      //     JSON.stringify(mockNote.to),
      //     mockNote.visibility,
      //     mockNote.id,
      //   ],
      // );
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      // mockDb.run.mockRejectedValueOnce(error);

      await expect(dbService.updateNoteInDB(mockNote)).rejects.toThrow("Database error");
    });
  });

  describe("deleteNoteFromDB", () => {
    it("should successfully delete a note from the database", async () => {
      const noteId = "1";
      await dbService.deleteNoteFromDB(noteId);

      // expect(mockDb.run).toHaveBeenCalledWith(
      //   "DELETE FROM notes WHERE id = ?",
      //   [noteId],
      // );
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      // mockDb.run.mockRejectedValueOnce(error);

      await expect(dbService.deleteNoteFromDB("1")).rejects.toThrow("Database error");
    });
  });

  describe("getNoteFromDB", () => {
    it("should successfully retrieve a note from the database", async () => {
      const username = "alice";
      const mockNoteData = { ...mockNote };
      // mockDb.get.mockResolvedValueOnce(mockNoteData);

      const result = await dbService.getNoteFromDB(username);

      // expect(mockDb.get).toHaveBeenCalledWith(
      //   "SELECT * FROM notes WHERE username = ?",
      //   [username],
      // );
      expect(result).toEqual(mockNoteData);
    });

    it("should return null if note is not found", async () => {
      // mockDb.get.mockResolvedValueOnce(null);

      const result = await dbService.getNoteFromDB("alice");

      expect(result).toBeNull();
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      // mockDb.get.mockRejectedValueOnce(error);

      await expect(dbService.getNoteFromDB("alice")).rejects.toThrow("Database error");
    });
  });
});

describe.skip("Database Actor Operations", () => {
  let mockActor: Actor;
  let dbService: DbService;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    process.env.DB_FILENAME = ":memory:";

    // Reset mock implementations
    // mockDb.run.mockResolvedValue(undefined);
    // mockDb.get.mockResolvedValue({ id: "1" });

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

    dbService = new DbService(await dbPromise);
  });

  describe("getActorFromDB", () => {
    it("should successfully retrieve an actor from the database", async () => {
      const username = "alice";
      const mockActorData = { ...mockActor };
      // mockDb.get.mockResolvedValueOnce(mockActorData);

      const result = await dbService.getActorFromDB(username);

      // expect(mockDb.get).toHaveBeenCalledWith(
      //   "SELECT * FROM actors WHERE preferredUsername = ?",
      //   [username],
      // );
      expect(result).toEqual(mockActorData);
    });

    it("should return null if actor is not found", async () => {
      // mockDb.get.mockResolvedValueOnce(null);

      const result = await dbService.getActorFromDB("alice");

      expect(result).toBeNull();
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      // mockDb.get.mockRejectedValueOnce(error);

      await expect(dbService.getActorFromDB("alice")).rejects.toThrow("Database error");
    });
  });
});

describe.skip("Database Followers Operations", () => {
  let mockFollowers: OrderedCollection;
  let dbService: DbService;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    process.env.DB_FILENAME = ":memory:";

    // Reset mock implementations
    // mockDb.run.mockResolvedValue(undefined);
    // mockDb.get.mockResolvedValue({ id: "1" });

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

    dbService = new DbService(await dbPromise);
  });

  describe("getFollowersFromDB", () => {
    it("should successfully retrieve followers from the database", async () => {
      const username = "alice";
      const mockFollowersData = { ...mockFollowers };
      // mockDb.get.mockResolvedValueOnce(mockFollowersData);

      const result = await dbService.getFollowersFromDB(username);

      // expect(mockDb.get).toHaveBeenCalledWith(
      //   "SELECT * FROM followers WHERE username = ?",
      //   [username],
      // );
      expect(result).toEqual(mockFollowersData);
    });

    it("should return null if followers are not found", async () => {
      // mockDb.get.mockResolvedValueOnce(null);

      const result = await dbService.getFollowersFromDB("alice");

      expect(result).toBeNull();
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      // mockDb.get.mockRejectedValueOnce(error);

      await expect(dbService.getFollowersFromDB("alice")).rejects.toThrow("Database error");
    });
  });

  describe("addFollowerToDB", () => {
    it("should successfully add a follower to the database", async () => {
      const username = "alice";
      const follower = "bob";

      await dbService.addFollowerToDB(username, follower);

      // expect(mockDb.run).toHaveBeenCalledWith(
      //   "INSERT INTO followers (username, follower) VALUES (?, ?)",
      //   [username, follower],
      // );
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      // mockDb.run.mockRejectedValueOnce(error);

      await expect(dbService.addFollowerToDB("alice", "bob")).rejects.toThrow("Database error");
    });
  });
});

describe.skip("Database Following Operations", () => {
  let mockFollowing: OrderedCollection;
  let dbService: DbService;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    process.env.DB_FILENAME = ":memory:";

    // Reset mock implementations
    // mockDb.run.mockResolvedValue(undefined);
    // mockDb.get.mockResolvedValue({ id: "1" });

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

    dbService = new DbService(await dbPromise);
  });

  describe("getFollowingFromDB", () => {
    it("should successfully retrieve following from the database", async () => {
      const username = "alice";
      const mockFollowingData = { ...mockFollowing };
      // mockDb.get.mockResolvedValueOnce(mockFollowingData);

      const result = await dbService.getFollowingFromDB(username);

      // expect(mockDb.get).toHaveBeenCalledWith(
      //   "SELECT * FROM following WHERE username = ?",
      //   [username],
      // );
      expect(result).toEqual(mockFollowingData);
    });

    it("should return null if following are not found", async () => {
      // mockDb.get.mockResolvedValueOnce(null);

      const result = await dbService.getFollowingFromDB("alice");

      expect(result).toBeNull();
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      // mockDb.get.mockRejectedValueOnce(error);

      await expect(dbService.getFollowingFromDB("alice")).rejects.toThrow("Database error");
    });
  });
});

describe.skip("Database Outbox Operations", () => {
  let mockOutbox: OrderedCollection;
  let dbService: DbService;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    process.env.DB_FILENAME = ":memory:";

    // Reset mock implementations
    // mockDb.run.mockResolvedValue(undefined);
    // mockDb.get.mockResolvedValue({ id: "1" });

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

    dbService = new DbService(await dbPromise);
  });

  describe("getOutboxFromDB", () => {
    it("should successfully retrieve outbox from the database", async () => {
      const username = "alice";
      const mockOutboxData = { ...mockOutbox };
      // mockDb.get.mockResolvedValueOnce(mockOutboxData);

      const result = await dbService.getOutboxFromDB(username);

      // expect(mockDb.get).toHaveBeenCalledWith(
      //   "SELECT * FROM outbox WHERE username = ?",
      //   [username],
      // );
      expect(result).toEqual(mockOutboxData);
    });

    it("should return null if outbox is not found", async () => {
      // mockDb.get.mockResolvedValueOnce(null);

      const result = await dbService.getOutboxFromDB("alice");

      expect(result).toBeNull();
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      // mockDb.get.mockRejectedValueOnce(error);

      await expect(dbService.getOutboxFromDB("alice")).rejects.toThrow("Database error");
    });
  });
});
