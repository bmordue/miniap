import { Request, Response } from 'express';
import { getNoteById } from '../services/databaseService';

export const getNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const note = await getNoteById(req.params.username, req.params.noteId);
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
