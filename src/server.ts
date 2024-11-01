import express from 'express';
import { json } from 'body-parser';
import { actor, note, createActivity, outboxCollection, emptyCollection } from './staticData';

const app = express();
app.use(json({ type: ['application/activity+json', 'application/ld+json'] }));

const PORT = 3000;
const DOMAIN = 'example.com';
const USERNAME = 'alice';
const BASE_URL = `https://${DOMAIN}/users/${USERNAME}`;

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
