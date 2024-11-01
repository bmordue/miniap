import { Request, Response } from 'express';
import { getNoteFromDB } from '../dbService';

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
