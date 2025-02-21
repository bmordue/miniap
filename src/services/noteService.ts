import { Request, Response } from 'express';
import DbService from '../dbService';
import { signActivity } from './utils';
import { open, Database } from 'sqlite';

export const getNote = async (req: Request, res: Response): Promise<void> => {
  const username = req.params.username;
  try {
    const dbService = new DbService(await open({
      filename: '../activitypub.db',
      driver: Database
    }));
    const note = await dbService.getNoteFromDB(username);
    if (!note) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const privateKey = '-----BEGIN PRIVATE KEY-----\n...your private key here...\n-----END PRIVATE KEY-----';
    const keyId = 'https://example.com/keys/1';
    const signedNote = signActivity(note, privateKey, keyId);

    res.json(signedNote);
  } catch (error) {
    console.error('Error fetching note from database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createNote = async (req: Request, res: Response): Promise<void> => {
  const note = req.body;
  try {
    const dbService = new DbService(await open({
      filename: '../activitypub.db',
      driver: Database
    }));
    await dbService.addNoteToDB(note);
    res.status(201).json(note);
  } catch (error) {
    console.error('Error adding note to database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }  
}

export const updateNote = async (req: Request, res: Response): Promise<void> => {
  const noteId = req.params.noteId;
  const note = req.body;

  try {
    const dbService = new DbService(await open({
      filename: '../activitypub.db',
      driver: Database
    }));
    await dbService.updateNoteInDB(note);
    res.status(200).json(note);
  } catch (error) {
    console.error('Error updating note in database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteNote = async (req: Request, res: Response): Promise<void> => {
  const noteId = req.params.noteId;

  try {
    const dbService = new DbService(await open({
      filename: '../activitypub.db',
      driver: Database
    }));
    await dbService.deleteNoteFromDB(noteId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting note from database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const create_reply = async (content: string, in_reply_to_id: string): Promise<any> => {
  const parent = await getNoteFromDB(in_reply_to_id);
  if (!parent) {
    throw new Error('Parent post not found');
  }

  const root_id = parent.root_post_id || parent.id;
  const depth = parent.thread_depth + 1;

  const activity = {
    "@context": "https://www.w3.org/ns/activitystreams",
    "type": "Create",
    "actor": "current_actor",
    "object": {
      "type": "Note",
      "content": content,
      "inReplyTo": parent.activity_id,
      "conversation": root_id,
      "depth": depth
    }
  };

  const [to, cc] = await get_thread_recipients(root_id);
  activity["to"] = to;
  activity["cc"] = cc;

  return activity;
};

export const process_reply_activity = async (activity: any): Promise<void> => {
  const object = activity.object;
  const in_reply_to = object.inReplyTo;

  const parent = await fetch_remote_object(in_reply_to);
  if (!parent) {
    throw new Error('Parent post not found');
  }

  const reply_id = await store_reply(
    activity,
    parent.local_id,
    parent.root_post_id || parent.local_id,
    object.depth || parent.thread_depth + 1
  );

  await update_reply_counts(parent.local_id);
  await notify_thread_participants(reply_id);
};

export const get_thread_context = async (post_id: string): Promise<any> => {
  const post = await getNoteFromDB(post_id);
  const root_id = post.root_post_id || post_id;

  const thread_posts = await db.fetch(`
    SELECT * FROM posts 
    WHERE root_post_id = ? 
    ORDER BY thread_depth, created_at
  `, root_id);

  const thread_tree = build_thread_tree(thread_posts);

  return {
    root: thread_tree,
    focused_post: post,
    participants: await get_thread_participants(root_id)
  };
};
