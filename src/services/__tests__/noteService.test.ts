import { Request, Response } from 'express';
import httpSignature from 'http-signature';
import { getNote, updateNote, deleteNote, create_reply, process_reply_activity, get_thread_context } from '../noteService';
import { getNoteFromDB, updateNoteInDB, deleteNoteFromDB, addNoteToDB } from '../../dbService';

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

describe('updateNote', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    process.env.DB_FILENAME = ":memory:";
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
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should update a note and return 200 status', async () => {
    await updateNote(req as Request, res as Response);

    expect(updateNoteInDB).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(req.body);
  });

  it('should return 500 if database throws an error', async () => {
    const error = new Error("Database connection failed");
    (updateNoteInDB as jest.Mock).mockRejectedValue(error);

    await updateNote(req as Request, res as Response);

    expect(updateNoteInDB).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

describe('deleteNote', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    process.env.DB_FILENAME = ":memory:";
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

    expect(deleteNoteFromDB).toHaveBeenCalledWith("1");
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('should return 500 if database throws an error', async () => {
    const error = new Error("Database connection failed");
    (deleteNoteFromDB as jest.Mock).mockRejectedValue(error);

    await deleteNote(req as Request, res as Response);

    expect(deleteNoteFromDB).toHaveBeenCalledWith("1");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

describe('create_reply', () => {
  it('should create a reply activity', async () => {
    const mockParentNote = {
      id: '1',
      root_post_id: '1',
      thread_depth: 0,
      activity_id: 'https://example.com/users/alice/notes/1'
    };

    (getNoteFromDB as jest.Mock).mockResolvedValue(mockParentNote);

    const content = 'This is a reply';
    const in_reply_to_id = '1';

    const activity = await create_reply(content, in_reply_to_id);

    expect(activity).toEqual({
      "@context": "https://www.w3.org/ns/activitystreams",
      "type": "Create",
      "actor": "current_actor",
      "object": {
        "type": "Note",
        "content": content,
        "inReplyTo": mockParentNote.activity_id,
        "conversation": mockParentNote.root_post_id,
        "depth": 1
      },
      "to": undefined,
      "cc": undefined
    });
  });

  it('should throw an error if parent post is not found', async () => {
    (getNoteFromDB as jest.Mock).mockResolvedValue(null);

    const content = 'This is a reply';
    const in_reply_to_id = '1';

    await expect(create_reply(content, in_reply_to_id)).rejects.toThrow('Parent post not found');
  });
});

describe('process_reply_activity', () => {
  it('should process a reply activity', async () => {
    const mockParentNote = {
      local_id: '1',
      root_post_id: '1',
      thread_depth: 0
    };

    const mockActivity = {
      object: {
        inReplyTo: 'https://example.com/users/alice/notes/1',
        depth: 1
      }
    };

    (fetch_remote_object as jest.Mock).mockResolvedValue(mockParentNote);
    (store_reply as jest.Mock).mockResolvedValue('2');

    await process_reply_activity(mockActivity);

    expect(fetch_remote_object).toHaveBeenCalledWith(mockActivity.object.inReplyTo);
    expect(store_reply).toHaveBeenCalledWith(
      mockActivity,
      mockParentNote.local_id,
      mockParentNote.root_post_id,
      mockActivity.object.depth
    );
    expect(update_reply_counts).toHaveBeenCalledWith(mockParentNote.local_id);
    expect(notify_thread_participants).toHaveBeenCalledWith('2');
  });

  it('should throw an error if parent post is not found', async () => {
    (fetch_remote_object as jest.Mock).mockResolvedValue(null);

    const mockActivity = {
      object: {
        inReplyTo: 'https://example.com/users/alice/notes/1',
        depth: 1
      }
    };

    await expect(process_reply_activity(mockActivity)).rejects.toThrow('Parent post not found');
  });
});

describe('get_thread_context', () => {
  it('should fetch entire thread context for a post', async () => {
    const mockPost = {
      id: '1',
      root_post_id: '1'
    };

    const mockThreadPosts = [
      { id: '1', thread_depth: 0, created_at: '2023-01-01T00:00:00Z' },
      { id: '2', in_reply_to_id: '1', thread_depth: 1, created_at: '2023-01-01T01:00:00Z' }
    ];

    (getNoteFromDB as jest.Mock).mockResolvedValue(mockPost);
    (db.fetch as jest.Mock).mockResolvedValue(mockThreadPosts);
    (build_thread_tree as jest.Mock).mockReturnValue(mockThreadPosts[0]);

    const context = await get_thread_context('1');

    expect(getNoteFromDB).toHaveBeenCalledWith('1');
    expect(db.fetch).toHaveBeenCalledWith(`
      SELECT * FROM posts 
      WHERE root_post_id = ? 
      ORDER BY thread_depth, created_at
    `, mockPost.root_post_id);
    expect(build_thread_tree).toHaveBeenCalledWith(mockThreadPosts);
    expect(context).toEqual({
      root: mockThreadPosts[0],
      focused_post: mockPost,
      participants: undefined
    });
  });

  it('should throw an error if post is not found', async () => {
    (getNoteFromDB as jest.Mock).mockResolvedValue(null);

    await expect(get_thread_context('1')).rejects.toThrow('Post not found');
  });
});
