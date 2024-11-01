import { Request, Response } from 'express';
import { getOutboxFromDB } from '../dbService';

export const getOutbox = async (req: Request, res: Response): Promise<void> => {
  const username = req.params.username;
  try {
    const outboxCollection = await getOutboxFromDB(username);
    if (!outboxCollection) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(outboxCollection);
  } catch (error) {
    console.error('Error fetching outbox from database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
