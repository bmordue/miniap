import { Request, Response } from "express";
import httpSignature from "http-signature";
import { getOutbox, createNote } from "../collectionService";
import DbService from "../dbService";
import { open, Database } from 'sqlite';

jest.mock("../../dbService");
jest.mock("http-signature");

describe.skip("getOutbox", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let db :DbService;

  beforeEach(async () => {
    const dbPromise = open({
      filename: ':memory:',
      driver: Database
    });
    db = new DbService(await dbPromise);    req = {
      params: { username: 'alice' },
    };    req = {
      params: { username: "alice" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should return outbox data when found in database", async () => {
    const mockOutboxData = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "OrderedCollection",
      totalItems: 1,
      orderedItems: [
        {
          "@context": "https://www.w3.org/ns/activitystreams",
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

    (db.getOutboxFromDB as jest.Mock).mockResolvedValue(mockOutboxData);

    await getOutbox(req as Request, res as Response);

    expect(db.getOutboxFromDB).toHaveBeenCalledWith("alice");
    expect(res.json).toHaveBeenCalledWith(mockOutboxData);
  });

  it("should return 404 if user is not found", async () => {
    (db.getOutboxFromDB as jest.Mock).mockResolvedValue(null);

    await getOutbox(req as Request, res as Response);

    expect(db.getOutboxFromDB).toHaveBeenCalledWith("alice");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  it("should return 500 if database throws an error", async () => {
    const error = new Error("Database connection failed");
    (db.getOutboxFromDB as jest.Mock).mockRejectedValue(error);

    await getOutbox(req as Request, res as Response);

    expect(db.getOutboxFromDB).toHaveBeenCalledWith("alice");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  it("should sign the outgoing activity", async () => {
    const mockOutboxData = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "OrderedCollection",
      totalItems: 1,
      orderedItems: [
        {
          "@context": "https://www.w3.org/ns/activitystreams",
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

    (db.getOutboxFromDB as jest.Mock).mockResolvedValue(mockOutboxData);

    await getOutbox(req as Request, res as Response);

    expect(httpSignature.sign).toHaveBeenCalled();
  });
});

describe.skip("createNote", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let db: DbService;

  beforeEach(async () => {
    const dbPromise = open({
      filename: ':memory:',
      driver: Database
    });
    db = new DbService(await dbPromise);    req = {
      params: { username: 'alice' },
    };    req = {
      params: { username: "alice" },
      body: {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "Note",
        id: "https://example.com/users/alice/notes/1",
        attributedTo: "https://example.com/users/alice",
        content: "Hello, World!",
        published: "2023-01-01T00:00:00Z",
        to: ["https://www.w3.org/ns/activitystreams#Public"],
        visibility: "public",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should create a note and return 201 status", async () => {
    await createNote(req as Request, res as Response);

    expect(db.addNoteToDB).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(req.body);
  });

  it("should return 500 if database throws an error", async () => {
    const error = new Error("Database connection failed");
    (db.addNoteToDB as jest.Mock).mockRejectedValue(error);

    await createNote(req as Request, res as Response);

    expect(db.addNoteToDB).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
