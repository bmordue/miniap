import { Request, Response } from 'express';
import httpSignature from 'http-signature';
import { getNote, updateNote, deleteNote } from '../noteService';
import DbService from '../dbService';
import { open, Database } from 'sqlite';

jest.mock('../dbService');
jest.mock('http-signature');

describe.skip('getNote', () => {
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
      params: { username: 'alice' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should return note data when found in database', async () => {
    const mockNoteData = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "Note",
      id: "https://example.com/users/alice/notes/1",
      attributedTo: "https://example.com/users/alice",
      content: "Hello, World!",
      published: "2023-01-01T00:00:00Z",
      to: ["https://www.w3.org/ns/activitystreams#Public"],
      visibility: "public",
    };

    (db.getNoteFromDB as jest.Mock).mockResolvedValue(mockNoteData);

    await getNote(req as Request, res as Response);

    expect(db.getNoteFromDB).toHaveBeenCalledWith("alice");
    expect(res.json).toHaveBeenCalledWith(mockNoteData);
  });

  it('should return 404 if note is not found', async () => {
    (db.getNoteFromDB as jest.Mock).mockResolvedValue(null);

    await getNote(req as Request, res as Response);

    expect(db.getNoteFromDB).toHaveBeenCalledWith("alice");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  it('should return 500 if database throws an error', async () => {
    const error = new Error("Database connection failed");
    (db.getNoteFromDB as jest.Mock).mockRejectedValue(error);

    await getNote(req as Request, res as Response);

    expect(db.getNoteFromDB).toHaveBeenCalledWith("alice");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  it('should sign the outgoing activity', async () => {
    const mockNoteData = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "Note",
      id: "https://example.com/users/alice/notes/1",
      attributedTo: "https://example.com/users/alice",
      content: "Hello, World!",
      published: "2023-01-01T00:00:00Z",
      to: ["https://www.w3.org/ns/activitystreams#Public"],
      visibility: "public",
    };

    (db.getNoteFromDB as jest.Mock).mockResolvedValue(mockNoteData);

    await getNote(req as Request, res as Response);

    expect(httpSignature.sign).toHaveBeenCalled();
  });
});

describe.skip('updateNote', () => {
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
    };
    req = {
      params: { noteId: '1' },
      body: {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "Note",
        id: "https://example.com/users/alice/notes/1",
        attributedTo: "https://example.com/users/alice",
        content: "Updated content",
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

  it('should update a note and return 200 status', async () => {
    await updateNote(req as Request, res as Response);

    expect(db.updateNoteInDB).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(req.body);
  });

  it('should return 500 if database throws an error', async () => {
    const error = new Error("Database connection failed");
    (db.updateNoteInDB as jest.Mock).mockRejectedValue(error);

    await updateNote(req as Request, res as Response);

    expect(db.updateNoteInDB).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

describe.skip('deleteNote', () => {
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
    };
    req = {
      params: { noteId: '1' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };
  });

  it('should delete a note and return 204 status', async () => {
    await deleteNote(req as Request, res as Response);

    expect(db.deleteNoteFromDB).toHaveBeenCalledWith("1");
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('should return 500 if database throws an error', async () => {
    const error = new Error("Database connection failed");
    (db.deleteNoteFromDB as jest.Mock).mockRejectedValue(error);

    await deleteNote(req as Request, res as Response);

    expect(db.deleteNoteFromDB).toHaveBeenCalledWith("1");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
