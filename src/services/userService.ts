import { Request, Response } from 'express';
import { actor, emptyCollection, followersCollection } from '../staticData';
import { USERNAME } from '../constants';

export const getUser = (req: Request, res: Response): void => {
  if (req.params.username !== USERNAME) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(actor);
};

export const getFollowers = (req: Request, res: Response): void => {
  if (req.params.username !== USERNAME) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(followersCollection);
};

export const getFollowing = (req: Request, res: Response): void => {
  if (req.params.username !== USERNAME) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(emptyCollection);
};
