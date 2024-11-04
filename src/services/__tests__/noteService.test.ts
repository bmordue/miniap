import { Request, Response } from 'express';
import { getNote } from '../noteService';
import { getNoteFromDB } from '../../dbService';
import httpSignature from 'http-signature';

jest.mock('../../dbService');
jest.mock('http-signature');

describe('getNote', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    process.env.DB_FILENAME = ":memory:";
    req = {
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
    };

    (getNoteFromDB as jest.Mock).mockResolvedValue(mockNoteData);

    await getNote(req as Request, res as Response);

    expect(getNoteFromDB).toHaveBeenCalledWith("alice");
    expect(res.json).toHaveBeenCalledWith(mockNoteData);
  });

  it('should return 404 if note is not found', async () => {
    (getNoteFromDB as jest.Mock).mockResolvedValue(null);

    await getNote(req as Request, res as Response);

    expect(getNoteFromDB).toHaveBeenCalledWith("alice");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  it('should return 500 if database throws an error', async () => {
    const error = new Error("Database connection failed");
    (getNoteFromDB as jest.Mock).mockRejectedValue(error);

    await getNote(req as Request, res as Response);

    expect(getNoteFromDB).toHaveBeenCalledWith("alice");
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
    };

    (getNoteFromDB as jest.Mock).mockResolvedValue(mockNoteData);

    await getNote(req as Request, res as Response);

    expect(httpSignature.sign).toHaveBeenCalled();
  });
});
