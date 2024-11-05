import { Request, Response } from 'express';
import httpSignature from 'http-signature';
import { getNoteFromDB, updateNoteInDB, deleteNoteFromDB, addNoteToDB } from '../dbService';

const signActivity = (activity: any, privateKey: string, keyId: string): any => {
  const signedActivity = { ...activity };
  const options = {
    key: privateKey,
    keyId: keyId,
    headers: ['(request-target)', 'date', 'digest'],
  };
  httpSignature.sign(signedActivity, options);
  return signedActivity;
};

export const getNote = async (req: Request, res: Response): Promise<void> => {
  const username = req.params.username;
  try {
    const note = await getNoteFromDB(username);
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
    await addNoteToDB(note);
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
    await updateNoteInDB(note);
    res.status(200).json(note);
  } catch (error) {
    console.error('Error updating note in database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteNote = async (req: Request, res: Response): Promise<void> => {
  const noteId = req.params.noteId;

  try {
    await deleteNoteFromDB(noteId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting note from database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
