import DbService from "../dbService";
import { Actor, OrderedCollection, VisibilityType } from "../../types";


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

// const dbPromise = open({
//   filename: ':memory:',
//   driver: Database
// });

// Mock the open function to return our mock database
// (open as jest.Mock).mockResolvedValue(mockDb);

let dbService: DbService;

describe('DbService', () => {
  it('should initialise db', async () => {
    const db = await DbService.open(':memory:');
    dbService = new DbService(db);
  });
});

describe("Database Note Operations", () => {

  const testNote = {
    "@context": "https://www.w3.org/ns/activitystreams",
    type: "Note",
    id: "https://example.com/users/alice/notes/1",
    attributedTo: "https://example.com/users/alice",
    content: "Test content",
    published: "2023-01-01T00:00:00Z",
    to: ["https://www.w3.org/ns/activitystreams#Public"],
    visibility: VisibilityType.Public,
  };

  beforeEach(async () => {
    const db = await DbService.open(':memory:');
    dbService = new DbService(db);
  });

  describe("addNoteToDB", () => {
    it("should successfully add a note to the database", async () => {
      await dbService.addNoteToDB(testNote);
    });

  });

  describe("updateNoteInDB", () => {
    it("should successfully update a note in the database", async () => {
      await dbService.updateNoteInDB(testNote);
    });
  });

  describe("deleteNoteFromDB", () => {
    it("should successfully delete a note from the database", async () => {
      const noteId = "1";
      await dbService.deleteNoteFromDB(noteId);
    });

  });

  describe("getNoteFromDB", () => {
    it("should successfully retrieve a note from the database", async () => {
      const username = "alice";
      const expectedNoteData = { ...testNote };
      await dbService.addNoteToDB(testNote);
      const result = await dbService.getNoteFromDB(testNote.attributedTo);
      expect(result).toEqual(expectedNoteData);
    });

    it("should return null if note is not found", async () => {
      const result = await dbService.getNoteFromDB("notaperson");
      expect(result).toBeNull();
    });
  });
});

describe("Database Actor Operations", () => {
  const testActor: Actor = {
    "@context": "https://www.w3.org/ns/activitystreams",
    type: "Person",
    id: "https://example.com/users/alice",
    preferredUsername: "alice",
    name: "Alice",
    inbox: "https://example.com/users/alice/inbox",
    outbox: "https://example.com/users/alice/outbox",
    following: "https://example.com/users/alice/following",
    followers: "https://example.com/users/alice/followers",
  };

  beforeEach(async () => {
    const db = await DbService.open(':memory:');
    dbService = new DbService(db);
  });

  describe("getActorFromDB", () => {
    it("should successfully retrieve an actor from the database", async () => {
      const expectedActorData = { ...testActor };
      await dbService.addActor(testActor);

      const result = await dbService.getActorFromDB(testActor.preferredUsername);
      expect(result).toEqual(expectedActorData);
    });

    it("should return null if actor is not found", async () => {
      // mockDb.get.mockResolvedValueOnce(null);

      const result = await dbService.getActorFromDB("alice");

      expect(result).toBeNull();
    });

  });
});

describe("Database Followers Operations", () => {
  const mockFollowers: OrderedCollection = {
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

  beforeEach(async () => {
    const db = await DbService.open(':memory:');
    dbService = new DbService(db);
  });

  describe("getFollowersFromDB", () => {

    // TODO
    it.skip("should successfully retrieve followers from the database", async () => {
      const username = "alice";

      // arrange
      await dbService.addActor({
        "id": "https://example.com/users/alice", "name": "Alice", "preferredUsername": username, "type": "Person",
        "@context": "",
        inbox: "",
        outbox: "",
        following: "",
        followers: ""
      });

      const followerUsername = "bob";
      await dbService.addActor({
        "id": "https://example.com/users/bob", "name": "Bob", "preferredUsername": followerUsername, "type": "Person",
        "@context": "",
        inbox: "",
        outbox: "",
        following: "",
        followers: ""
      });
      await dbService.addFollowerToDB(username, followerUsername);

      const followerUsernameTwo = "charlie";
      await dbService.addActor({
        "id": "https://example.com/users/charlie", "name": "Charlie", "preferredUsername": followerUsernameTwo, "type": "Person",
        "@context": "",
        inbox: "",
        outbox: "",
        following: "",
        followers: ""
      });
      await dbService.addFollowerToDB(username, followerUsernameTwo);


      // act 
      const result = await dbService.getFollowersFromDB(username);

      // assert
      expect(result).toEqual(mockFollowers);
    });

    it("should return null if followers are not found", async () => {
      // mockDb.get.mockResolvedValueOnce(null);

      const result = await dbService.getFollowersFromDB("alice");

      expect(result).toBeNull();
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


  });
});

describe("Database Following Operations", () => {
  const mockFollowing: OrderedCollection= {
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


  describe("getFollowingFromDB", () => {
    it.skip("should successfully retrieve following from the database", async () => {
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

  });
});

describe("Database Outbox Operations", () => {
  let mockOutbox: OrderedCollection;

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

    const db = await DbService.open(':memory:');
    dbService = new DbService(db);
  });

  describe("getOutboxFromDB", () => {
    beforeEach(async () => {
      const db = await DbService.open(':memory:');
      dbService = new DbService(db);
    });
    it.skip("should successfully retrieve outbox from the database", async () => {
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

  });
});
