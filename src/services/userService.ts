import { Request, Response } from 'express';
import { getActorFromDB, getFollowersFromDB, getFollowingFromDB } from '../dbService';

export const getUser = async (req: Request, res: Response): Promise<void> => {
  const username = req.params.username;
  try {
    const actor = await getActorFromDB(username);
    if (!actor) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(actor);
  } catch (error) {
    console.error('Error fetching actor from database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFollowers = async (req: Request, res: Response): Promise<void> => {
  const username = req.params.username;
  try {
    const followersCollection = await getFollowersFromDB(username);
    if (!followersCollection) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(followersCollection);
  } catch (error) {
    console.error('Error fetching followers from database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFollowing = async (req: Request, res: Response): Promise<void> => {
  const username = req.params.username;
  try {
    const followingCollection = await getFollowingFromDB(username);
    if (!followingCollection) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(followingCollection);
  } catch (error) {
    console.error('Error fetching following from database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
