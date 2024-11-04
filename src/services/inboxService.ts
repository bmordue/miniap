import { Request, Response } from 'express';
import { getActorFromDB, addFollowerToDB } from '../dbService';
import fetch from 'node-fetch';
import httpSignature from 'http-signature';

const isValidUrl = (url: string): boolean => {
  const allowedDomains = ['example.com', 'another-allowed-domain.com'];
  try {
    const parsedUrl = new URL(url);
    return allowedDomains.includes(parsedUrl.hostname) && parsedUrl.pathname === '/inbox';
  } catch (e) {
    return false;
  }
};

const verifyRequestSignature = (req: Request): boolean => {
  try {
    const parsed = httpSignature.parseRequest(req.body);
    const publicKey = '-----BEGIN PUBLIC KEY-----\n...your public key here...\n-----END PUBLIC KEY-----';
    return httpSignature.verifySignature(parsed, publicKey);
  } catch (e) {
    console.error('Error verifying request signature:', e);
    return false;
  }
};

export const postInbox = async (req: Request, res: Response): Promise<void> => {
  if (!verifyRequestSignature(req)) {
    res.status(400).json({ error: 'Invalid request signature' });
    return;
  }

  const username = req.params.username;
  const actor = await getActorFromDB(username);

  if (!actor) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const activity = req.body;
  console.log('Received activity:', activity);

  if (activity.type === 'Follow') {
    // Respond with an Accept activity
    const acceptActivity = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "Accept",
      actor: actor.id,
      object: activity,
      to: [activity.actor]
    };

    if (!isValidUrl(activity.actor.inbox)) {
      res.status(400).json({ error: 'Invalid inbox URL' });
      return;
    }

    try {
      const response = await fetch(activity.actor.inbox, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/activity+json'
        },
        body: JSON.stringify(acceptActivity)
      });

      if (!response.ok) {
        console.error('Failed to send Accept activity:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending Accept activity:', error);
    }

    // Update the followers collection
    await addFollowerToDB(username, activity.actor);
  }

  res.status(200).json({ status: 'ok' });
};
