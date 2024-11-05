import { Request, Response } from 'express';
import { getActorFromDB, addFollowerToDB, getFollowersWithVisibilityFromDB, logDeliveryFailure } from '../dbService';
import fetch from 'node-fetch';
import httpSignature from 'http-signature';
import { Activity, FollowerWithVisibility, Note } from '../types';
import { signActivity } from './utils';

function last(arr :any[]) {
  return arr[arr.length - 1];
}

async function postActivity(url: fetch.RequestInfo, activity: Activity) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/activity+json",
      },
      body: JSON.stringify(activity),
    });

    if (!response.ok) {
      console.error("Failed to send activity:", response.statusText);
    } else {
      console.log("Activity sent successfully:", response.status);
    }
  } catch (error) {
    console.error("Error sending activity:", error);
  }
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
  const actor = await getActorFromDB(username);

  if (!actor) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const activity = req.body;
  console.log('Received activity:', activity);

  if (activity.type === 'Follow') {
    // Respond with an Accept activity
    const acceptActivity :Activity = {
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

    await postActivity(activity.actor.inbox, acceptActivity);

    // TODO: shouldn't add to followers collection if postActivity failed?
    // Update the followers collection
    await addFollowerToDB(username, activity.actor);
  }

  res.status(200).json({ status: 'ok' });
};

async function notifyFollower(username :string, follower: FollowerWithVisibility, activity :Note) {
  if (activity.to.includes(follower.visibility)) {
    const privateKey = '-----BEGIN PRIVATE KEY-----\n...your private key here...\n-----END PRIVATE KEY-----';
    const keyId = 'https://example.com/keys/1';
    const signedAcceptActivity = signActivity(acceptActivity, privateKey, keyId);

    try {
      const response = await fetch(follower.inbox, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/activity+json'
        },
        body: JSON.stringify(signedAcceptActivity)
      });

      if (!response.ok) {
        throw new Error(`Failed to deliver activity to ${follower.inbox}: ${response.statusText}`);
      }
    } catch (error :any) {
      await handleDeliveryFailure(username, activity.id, error.message);
    }
  }
}

export async function distributeActivity(req: Request, res: Response): Promise<void> {
  const username = req.params.username;
  const activity = req.body;

  try {
    const followers = await getFollowersWithVisibilityFromDB(username);
    if (!followers) {
      res.status(404).json({ error: 'Followers not found' });
      return;
    }

    const deliveryPromises = followers.map(f => notifyFollower(username, f, activity));

    await Promise.all(deliveryPromises);
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Error distributing activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export async function handleDeliveryFailure(username: string, activityId: string, error: string): Promise<void> {
  try {
    await logDeliveryFailure(username, activityId, error);
  } catch (logError) {
    console.error('Error logging delivery failure:', logError);
  }
};
