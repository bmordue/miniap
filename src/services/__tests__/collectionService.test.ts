import { Request, Response } from "express";
import httpSignature from "http-signature";
import { getOutbox, createNote } from "../collectionService";
import { getOutboxFromDB, addNoteToDB } from "../../dbService";

jest.mock("../../dbService");
jest.mock("http-signature");

describe("getOutbox", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    process.env.DB_FILENAME = ":memory:";
    req = {
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

    (getOutboxFromDB as jest.Mock).mockResolvedValue(mockOutboxData);

    await getOutbox(req as Request, res as Response);

    expect(getOutboxFromDB).toHaveBeenCalledWith("alice");
    expect(res.json).toHaveBeenCalledWith(mockOutboxData);
  });

  it("should return 404 if user is not found", async () => {
    (getOutboxFromDB as jest.Mock).mockResolvedValue(null);

    await getOutbox(req as Request, res as Response);

    expect(getOutboxFromDB).toHaveBeenCalledWith("alice");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  it("should return 500 if database throws an error", async () => {
    const error = new Error("Database connection failed");
    (getOutboxFromDB as jest.Mock).mockRejectedValue(error);

    await getOutbox(req as Request, res as Response);

    expect(getOutboxFromDB).toHaveBeenCalledWith("alice");
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

    (getOutboxFromDB as jest.Mock).mockResolvedValue(mockOutboxData);

    await getOutbox(req as Request, res as Response);

    expect(httpSignature.sign).toHaveBeenCalled();
  });
});

describe("createNote", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    process.env.DB_FILENAME = ":memory:";
    req = {
      params: { username: "alice" },
      body: {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "Note",
        id: "https://example.com/users/alice/notes/1",
        attributedTo: "https://example.com/users/alice",
        content: "Hello, World!",
        published: "2023-01-01T00:00:00Z",
        to: ["https://www.w3.org/ns/activitystreams#Public"],
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should create a note and return 201 status", async () => {
    await createNote(req as Request, res as Response);

    expect(addNoteToDB).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(req.body);
  });

  it("should return 500 if database throws an error", async () => {
    const error = new Error("Database connection failed");
    (addNoteToDB as jest.Mock).mockRejectedValue(error);

    await createNote(req as Request, res as Response);

    expect(addNoteToDB).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

describe("getThreadContext", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    process.env.DB_FILENAME = ":memory:";
    req = {
      params: { id: "1" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should return thread context when found in database", async () => {
    const mockThreadContext = {
      root: {
        id: "1",
        content: "Root post",
        replies: [
          {
            id: "2",
            content: "Reply 1",
            replies: [],
          },
        ],
      },
      focused_post: {
        id: "1",
        content: "Root post",
      },
      participants: [],
    };

    (getThreadContext as jest.Mock).mockResolvedValue(mockThreadContext);

    await getThreadContext(req as Request, res as Response);

    expect(getThreadContext).toHaveBeenCalledWith("1");
    expect(res.json).toHaveBeenCalledWith(mockThreadContext);
  });

  it("should return 404 if thread context is not found", async () => {
    (getThreadContext as jest.Mock).mockResolvedValue(null);

    await getThreadContext(req as Request, res as Response);

    expect(getThreadContext).toHaveBeenCalledWith("1");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Thread context not found" });
  });

  it("should return 500 if database throws an error", async () => {
    const error = new Error("Database connection failed");
    (getThreadContext as jest.Mock).mockRejectedValue(error);

    await getThreadContext(req as Request, res as Response);

    expect(getThreadContext).toHaveBeenCalledWith("1");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

describe("createReply", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    process.env.DB_FILENAME = ":memory:";
    req = {
      params: { id: "1" },
      body: {
        content: "This is a reply",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should create a reply and return 201 status", async () => {
    const mockReplyActivity = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "Create",
      actor: "current_actor",
      object: {
        type: "Note",
        content: "This is a reply",
        inReplyTo: "https://example.com/users/alice/notes/1",
        conversation: "1",
        depth: 1,
      },
      to: [],
      cc: [],
    };

    (createReply as jest.Mock).mockResolvedValue(mockReplyActivity);
    (addNoteToDB as jest.Mock).mockResolvedValue("2");
    (getNoteFromDB as jest.Mock).mockResolvedValue(mockReplyActivity);

    await createReply(req as Request, res as Response);

    expect(createReply).toHaveBeenCalledWith("This is a reply", "1");
    expect(addNoteToDB).toHaveBeenCalledWith(mockReplyActivity);
    expect(getNoteFromDB).toHaveBeenCalledWith("2");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockReplyActivity);
  });

  it("should return 500 if database throws an error", async () => {
    const error = new Error("Database connection failed");
    (createReply as jest.Mock).mockRejectedValue(error);

    await createReply(req as Request, res as Response);

    expect(createReply).toHaveBeenCalledWith("This is a reply", "1");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
