import { Request, Response } from 'express';
import { Note } from '../types';
import { signActivity } from './utils';
import DbService from './dbService';
import { Database, open } from "sqlite";

class CollectionService {
  dbService: DbService;

  constructor(dbService: DbService) {
    this.dbService = dbService;
  }

public async getOutbox(req: Request, res: Response): Promise<void> {
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

public async createNote(req: Request, res: Response): Promise<void> {
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

// duplicated from activityService!

// public async postLike(req: Request, res: Response): Promise<void> {
//   const { actor, object, id } = req.body;
//   const dbService = new DbService(await open({
//     filename: '../activitypub.db',
//     driver: Database
//   }));

//   try {
//     await dbService.addLikeToDB(actor, object, id);
//     res.status(201).json({ status: 'Like added' });
//   } catch (error) {
//     console.error('Error adding like to database:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

public async postAnnounce(req: Request, res: Response): Promise<void> {
  const { actor, object, id } = req.body;
  const dbService = new DbService(await open({
    filename: '../activitypub.db',
    driver: Database
  }));

  try {
    await dbService.addAnnounceToDB(actor, object, id);
    res.status(201).json({ status: 'Announce added' });
  } catch (error) {
    console.error('Error adding announce to database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

public async postUndo(req: Request, res: Response): Promise<void> {
  const { actor, object } = req.body;
  const dbService = new DbService(await open({
    filename: '../activitypub.db',
    driver: Database
  }));

  try {
    if (object.type === 'Like') {
      await dbService.removeLikeFromDB(actor, object.id);
      res.status(200).json({ status: 'Like removed' });
    } else if (object.type === 'Announce') {
      await dbService.removeAnnounceFromDB(actor, object.id);
      res.status(200).json({ status: 'Announce removed' });
    } else {
      res.status(400).json({ error: 'Invalid activity type' });
    }
  } catch (error) {
    console.error('Error processing undo activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

}

export default CollectionService;