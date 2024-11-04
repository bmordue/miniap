import { Request, Response } from 'express';
import { getOutboxFromDB } from '../dbService';
import httpSignature from 'http-signature';

const signActivity = (activity: any, privateKey: string, keyId: string): any => {
  const signedActivity = { ...activity };
  const options = {
    key: privateKey,
    keyId: keyId,
    headers: ['(request-target)', 'date', 'digest'],
  };
  httpSignature.sign(signedActivity, options);
  return signedActivity;
};

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
