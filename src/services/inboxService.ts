import { Request, Response } from 'express';
import { open, Database } from 'sqlite';
import DbService from '../dbService';
import fetch from 'node-fetch';
import httpSignature from 'http-signature';
import { signActivity } from './utils';

function last(arr :any[]) {
  return arr[arr.length - 1];
}

export function isValidUrl(url: string): boolean {
  const allowedDomains = ['example.com', 'another-allowed-domain.com'];
  try {
    const parsedUrl = new URL(url);
    return allowedDomains.includes(parsedUrl.hostname) && last(parsedUrl.pathname.split('/')) === 'inbox';
  } catch (e) {
    return false;
  }
};

function verifyRequestSignature(req: Request): boolean {
  try {
    const parsed = httpSignature.parseRequest(req.body);
    const publicKey = '-----BEGIN PUBLIC KEY-----\n...your public key here...\n-----END PUBLIC KEY-----';
    return httpSignature.verifySignature(parsed, publicKey);
  } catch (e) {
    console.error('Error verifying request signature:', e);
    return false;
  }
};

export async function postInbox(req: Request, res: Response): Promise<void> {
  if (!verifyRequestSignature(req)) {
    res.status(400).json({ error: 'Invalid request signature' });
    return;
  }

  const username = req.params.username;
  const dbService = new DbService(await open({
    filename: '../activitypub.db',
    driver: Database
  }));
  const actor = await dbService.getActorFromDB(username);

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

    const privateKey = '-----BEGIN PRIVATE KEY-----\n...your private key here...\n-----END PRIVATE KEY-----';
    const keyId = 'https://example.com/keys/1';
    const signedAcceptActivity = signActivity(acceptActivity, privateKey, keyId);

    try {
      const response = await fetch(activity.actor.inbox, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/activity+json'
        },
        body: JSON.stringify(signedAcceptActivity)
      });

      if (!response.ok) {
        console.error('Failed to send Accept activity:', response.statusText);
      } else {
        console.log('Accept activity sent successfully:', response.status);
      }
    } catch (error) {
      console.error('Error sending Accept activity:', error);
    }

    // Update the followers collection
    const dbService = new DbService(await open({
      filename: '../activitypub.db',
      driver: Database
    }));
    await dbService.addFollowerToDB(username, activity.actor);
  }

  res.status(200).json({ status: 'ok' });
};
