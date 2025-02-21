import { Request, Response } from 'express';
import DbService from '../dbService';
import { signActivity } from './utils';
import { open, Database } from 'sqlite';

export const getUser = async (req: Request, res: Response): Promise<void> => {
  const username = req.params.username;
  try {
    const dbService = new DbService(await open({
      filename: '../activitypub.db',
      driver: Database
    }));
    const actor = dbService.getActorFromDB(username);
    if (!actor) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const privateKey = '-----BEGIN PRIVATE KEY-----\n...your private key here...\n-----END PRIVATE KEY-----';
    const keyId = 'https://example.com/keys/1';
    const signedActor = signActivity(actor, privateKey, keyId);

    res.json(signedActor);
  } catch (error) {
    console.error('Error fetching actor from database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFollowers = async (req: Request, res: Response): Promise<void> => {
  const username = req.params.username;
  try {
    const dbService = new DbService(await open({
      filename: '../activitypub.db',
      driver: Database
    }));
    const followersCollection = await dbService.getFollowersFromDB(username);
    if (!followersCollection) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const privateKey = '-----BEGIN PRIVATE KEY-----\n...your private key here...\n-----END PRIVATE KEY-----';
    const keyId = 'https://example.com/keys/1';
    const signedFollowersCollection = signActivity(followersCollection, privateKey, keyId);

    res.json(signedFollowersCollection);
  } catch (error) {
    console.error('Error fetching followers from database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFollowing = async (req: Request, res: Response): Promise<void> => {
  const username = req.params.username;
  try {
    const dbService = new DbService(await open({
      filename: '../activitypub.db',
      driver: Database
    }));
    const followingCollection = await dbService.getFollowingFromDB(username);
    if (!followingCollection) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const privateKey = '-----BEGIN PRIVATE KEY-----\n...your private key here...\n-----END PRIVATE KEY-----';
    const keyId = 'https://example.com/keys/1';
    const signedFollowingCollection = signActivity(followingCollection, privateKey, keyId);

    res.json(signedFollowingCollection);
  } catch (error) {
    console.error('Error fetching following from database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
