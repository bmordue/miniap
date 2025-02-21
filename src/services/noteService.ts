import { Request, Response } from 'express';
import DbService from './dbService';
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
