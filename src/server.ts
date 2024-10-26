// types.ts
import { Request, Response } from 'express';

type Actor = {
  "@context": string[];
  type: string;
  id: string;
  inbox: string;
  outbox: string;
  following: string;
  followers: string;
  preferredUsername: string;
  name: string;
  publicKey?: {
    id: string;
    owner: string;
    publicKeyPem: string;
  };
}

type OrderedCollection = {
  "@context": string;
  type: string;
  totalItems: number;
  orderedItems: any[];
}

type Note = {
  "@context": string;
  type: string;
  id: string;
  attributedTo: string;
  content: string;
  published: string;
  to: string[];
}

type Create = {
  "@context": string;
  type: string;
  id: string;
  actor: string;
  published: string;
  object: Note;
  to: string[];
}

// server.ts
import express from 'express';
import { json } from 'body-parser';

const app = express();
app.use(json({ type: ['application/activity+json', 'application/ld+json'] }));

const PORT = 3000;
const DOMAIN = 'example.com';
const USERNAME = 'alice';
const BASE_URL = `https://${DOMAIN}/users/${USERNAME}`;

// Static actor document
const actor: Actor = {
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1"
  ],
  type: "Person",
  id: BASE_URL,
  inbox: `${BASE_URL}/inbox`,
  outbox: `${BASE_URL}/outbox`,
  following: `${BASE_URL}/following`,
  followers: `${BASE_URL}/followers`,
  preferredUsername: USERNAME,
  name: "Alice",
  publicKey: {
    id: `${BASE_URL}#main-key`,
    owner: BASE_URL,
    publicKeyPem: "-----BEGIN PUBLIC KEY-----\n..."
  }
};

// Static note
const note: Note = {
  "@context": "https://www.w3.org/ns/activitystreams",
  type: "Note",
  id: `${BASE_URL}/notes/1`,
  attributedTo: BASE_URL,
  content: "Hello, ActivityPub world! This is a static note in my outbox.",
  published: "2024-01-01T00:00:00Z",
  to: ["https://www.w3.org/ns/activitystreams#Public"]
};

// Create activity wrapping the note
const createActivity: Create = {
  "@context": "https://www.w3.org/ns/activitystreams",
  type: "Create",
  id: `${BASE_URL}/create/1`,
  actor: BASE_URL,
  published: "2024-01-01T00:00:00Z",
  object: note,
  to: ["https://www.w3.org/ns/activitystreams#Public"]
};

// Outbox collection
const outboxCollection: OrderedCollection = {
  "@context": "https://www.w3.org/ns/activitystreams",
  type: "OrderedCollection",
  totalItems: 1,
  orderedItems: [createActivity]
};

// Empty collection for followers/following
const emptyCollection: OrderedCollection = {
  "@context": "https://www.w3.org/ns/activitystreams",
  type: "OrderedCollection",
  totalItems: 0,
  orderedItems: []
};

// Middleware for ActivityPub content type headers
const activityPubHeaders = (_req: express.Request, res: Response, next: express.NextFunction): void => {
  res.setHeader('Content-Type', 'application/activity+json');
  next();
};

// Routes
app.get('/users/:username', activityPubHeaders, (req: Request, res: Response): void => {
  if (req.params.username !== USERNAME) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(actor);
});

app.get('/users/:username/followers', activityPubHeaders, (req: Request, res: Response): void => {
  if (req.params.username !== USERNAME) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(emptyCollection);
});

app.get('/users/:username/following', activityPubHeaders, (req: Request, res: Response): void => {
  if (req.params.username !== USERNAME) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(emptyCollection);
});

app.get('/users/:username/outbox', activityPubHeaders, (req: Request, res: Response): void => {
  if (req.params.username !== USERNAME) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(outboxCollection);
});

app.get('/users/:username/notes/1', activityPubHeaders, (req: Request, res: Response): void => {
  if (req.params.username !== USERNAME) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(note);
});

app.post('/users/:username/inbox', activityPubHeaders, (req: Request, res: Response): void => {
  if (req.params.username !== USERNAME) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  console.log('Received activity:', req.body);
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
