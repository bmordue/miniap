import { Request, Response } from 'express';
import { getUserByUsername, getFollowersCollection, getFollowingCollection } from '../services/databaseService';

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getUserByUsername(req.params.username);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFollowers = async (req: Request, res: Response): Promise<void> => {
  try {
    const followersCollection = await getFollowersCollection(req.params.username);
    if (!followersCollection) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(followersCollection);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFollowing = async (req: Request, res: Response): Promise<void> => {
  try {
    const followingCollection = await getFollowingCollection(req.params.username);
    if (!followingCollection) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(followingCollection);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
