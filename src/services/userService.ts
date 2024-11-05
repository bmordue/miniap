import { Request, Response } from 'express';
import { getActorFromDB, getFollowersFromDB, getFollowingFromDB, getFollowersWithVisibilityFromDB, logDeliveryFailure, getDeliveryFailures } from '../dbService';

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

export const getFollowersWithVisibility = async (req: Request, res: Response): Promise<void> => {
  const username = req.params.username;
  try {
    const followers = await getFollowersWithVisibilityFromDB(username);
    if (!followers) {
      res.status(404).json({ error: 'Followers not found' });
      return;
    }
    res.json(followers);
  } catch (error) {
    console.error('Error fetching followers with visibility from database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const storeAndLogDeliveryFailure = async (req: Request, res: Response): Promise<void> => {
  const { username, activityId, error } = req.body;
  try {
    await logDeliveryFailure(username, activityId, error);
    res.status(200).json({ status: 'ok' });
  } catch (logError) {
    console.error('Error logging delivery failure:', logError);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const retrieveDeliveryFailures = async (req: Request, res: Response): Promise<void> => {
  const username = req.params.username;
  try {
    const deliveryFailures = await getDeliveryFailures(username);
    if (!deliveryFailures) {
      res.status(404).json({ error: 'Delivery failures not found' });
      return;
    }
    res.json(deliveryFailures);
  } catch (error) {
    console.error('Error fetching delivery failures from database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
