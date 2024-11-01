import { Request, Response } from 'express';
import { USERNAME } from '../constants';

export const postInbox = (req: Request, res: Response): void => {
  if (req.params.username !== USERNAME) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  console.log('Received activity:', req.body);
  res.status(200).json({ status: 'ok' });
};
