import { Request, Response } from 'express';
import { getOutboxFromDB, addNoteToDB, addLikeToDB, addAnnounceToDB, removeLikeFromDB, removeAnnounceFromDB } from '../dbService';
import { Note } from '../types';
import { signActivity } from './utils';

export const getOutbox = async (req: Request, res: Response): Promise<void> => {
  const username = req.params.username;
  try {
    const outboxCollection = await getOutboxFromDB(username);
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

  try {
    await addNoteToDB(note);
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note in database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const postLike = async (req: Request, res: Response): Promise<void> => {
  const { actor, object, id } = req.body;

  try {
    await addLikeToDB(actor, object, id);
    res.status(201).json({ status: 'Like added' });
  } catch (error) {
    console.error('Error adding like to database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const postAnnounce = async (req: Request, res: Response): Promise<void> => {
  const { actor, object, id } = req.body;

  try {
    await addAnnounceToDB(actor, object, id);
    res.status(201).json({ status: 'Announce added' });
  } catch (error) {
    console.error('Error adding announce to database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const postUndo = async (req: Request, res: Response): Promise<void> => {
  const { actor, object } = req.body;

  try {
    if (object.type === 'Like') {
      await removeLikeFromDB(actor, object.id);
      res.status(200).json({ status: 'Like removed' });
    } else if (object.type === 'Announce') {
      await removeAnnounceFromDB(actor, object.id);
      res.status(200).json({ status: 'Announce removed' });
    } else {
      res.status(400).json({ error: 'Invalid activity type' });
    }
  } catch (error) {
    console.error('Error processing undo activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
