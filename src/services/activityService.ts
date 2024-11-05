import { Request, Response } from 'express';
import { addLikeToDB, removeLikeFromDB, addAnnounceToDB, removeAnnounceFromDB } from '../dbService';

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
