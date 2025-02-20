import { Request, Response } from 'express';
import { Note } from '../types';
import { signActivity } from './utils';
import DbService from '../dbService';
import { Database, open } from "sqlite";

export const getOutbox = async (req: Request, res: Response): Promise<void> => {
  const username = req.params.username;
  const dbService = new DbService(await open({
    filename: '../activitypub.db',
    driver: Database
  }));
  try {
    const outboxCollection = await dbService.getOutboxFromDB(username);
    if (!outboxCollection) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const privateKey = '-----BEGIN PRIVATE KEY-----\n...your private key here...\n-----END PRIVATE KEY-----';
    const keyId = 'https://example.com/keys/1';
    const signedOutboxCollection = signActivity(outboxCollection, privateKey, keyId);

    res.json(signedOutboxCollection);
  } catch (error) {
    console.error('Error fetching outbox from database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createNote = async (req: Request, res: Response): Promise<void> => {
  const username = req.params.username;
  const note: Note = req.body;
  const dbService = new DbService(await open({
    filename: '../activitypub.db',
    driver: Database
  }));
  try {
    await dbService.addNoteToDB(note);
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note in database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
