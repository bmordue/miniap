import { Request, Response } from 'express';
import { USERNAME } from '../constants';
import { actor, followersCollection } from '../staticData';
import fetch from 'node-fetch';

const isValidUrl = (url: string): boolean => {
  const allowedDomains = ['example.com', 'another-allowed-domain.com'];
  try {
    const parsedUrl = new URL(url);
    return allowedDomains.includes(parsedUrl.hostname);
  } catch (e) {
    return false;
  }
};

export const postInbox = async (req: Request, res: Response): Promise<void> => {
  if (req.params.username !== USERNAME) {
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
    followersCollection.orderedItems.push(activity.actor);
    followersCollection.totalItems += 1;
  }

  res.status(200).json({ status: 'ok' });
};
