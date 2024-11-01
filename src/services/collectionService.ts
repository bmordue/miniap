import { Request, Response } from 'express';
import { getOutboxCollection } from '../services/databaseService';

export const getOutbox = async (req: Request, res: Response): Promise<void> => {
  try {
    const outboxCollection = await getOutboxCollection(req.params.username);
    if (!outboxCollection) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(outboxCollection);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
