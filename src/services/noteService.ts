import { Request, Response } from 'express';
import { note } from '../staticData';
import { USERNAME } from '../constants';

export const getNote = (req: Request, res: Response): void => {
  if (req.params.username !== USERNAME) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(note);
};