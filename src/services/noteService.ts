import { Request, Response } from 'express';
import { getNoteFromDB, updateNoteInDB, deleteNoteFromDB } from '../dbService';

export const getNote = async (req: Request, res: Response): Promise<void> => {
  const username = req.params.username;
  try {
    const note = await getNoteFromDB(username);
    if (!note) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(note);
  } catch (error) {
    console.error('Error fetching note from database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

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
