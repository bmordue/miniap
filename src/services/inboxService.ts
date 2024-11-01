import { Request, Response } from 'express';
import { getUserByUsername } from '../services/userService';

export const postInbox = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserByUsername(req.params.username);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    console.log('Received activity:', req.body);
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
