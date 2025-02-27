import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { json } from 'body-parser';
import { getUser, getFollowers, getFollowing } from './services/userService';
import { getOutbox } from './services/collectionService';
import { getNote, createNote, updateNote, deleteNote, get_thread_context, create_reply } from './services/noteService';
import { postInbox } from './services/inboxService';
import { process_activity_for_notifications } from './services/notificationService';
import { postLike, postAnnounce, postUndo } from './services/activityService';
import { distributeActivity } from './services/inboxService';
import DbService from './services/dbService';
import { open, Database } from "sqlite";

const app = express();

// Set up rate limiter: maximum of 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(json({ type: ['application/activity+json', 'application/ld+json'] }));

// Middleware for logging requests
const logRequests = (req: Request, res: Response, next: NextFunction): void => {
  console.log(`${req.method} ${req.url}`);
  res.on('finish', () => {
    console.log(`Response status: ${res.statusCode}`);
  });
  next();
};

// Apply the logging middleware to the Express app
app.use(logRequests);

// Middleware for ActivityPub content type headers
const activityPubHeaders = (_req: express.Request, res: Response, next: NextFunction): void => {
  res.setHeader('Content-Type', 'application/activity+json');
  next();
};

// Routes
app.get('/users/:username', activityPubHeaders, getUser);

app.get('/users/:username/followers', activityPubHeaders, getFollowers);

app.get('/users/:username/following', activityPubHeaders, getFollowing);

app.get('/users/:username/outbox', activityPubHeaders, getOutbox);

app.get('/users/:username/notes/1', activityPubHeaders, getNote);

app.post('/users/:username/inbox', limiter, activityPubHeaders, async (req: Request, res: Response) => {
  await postInbox(req, res);
  await process_activity_for_notifications(req.body);
});

app.post('/users/:username/notify', limiter, activityPubHeaders, distributeActivity);

app.post('/users/:username/outbox', activityPubHeaders, createNote);

app.put('/users/:username/notes/:noteId', activityPubHeaders, updateNote);

app.delete('/users/:username/notes/:noteId', activityPubHeaders, deleteNote);

app.get('/api/v1/statuses/:id/context', activityPubHeaders, async (req: Request, res: Response) => {
  try {
    const context = await get_thread_context(req.params.id);
    res.json(context);
  } catch (error) {
    console.error('Error fetching thread context:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/statuses/:id/reply', activityPubHeaders, async (req: Request, res: Response) => {
  try {
    const dbService = new DbService(await open({
      filename: '../activitypub.db',
      driver: Database
    }));

    const activity = await create_reply(req.body.content, req.params.id);
    const reply_id = activity.id;
    await dbService.addNoteToDB(activity);
    res.status(201).json(await dbService.getNoteFromDB(reply_id));
  } catch (error) {
    console.error('Error creating reply:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/users/:username/likes', activityPubHeaders, postLike);

app.post('/users/:username/announces', activityPubHeaders, postAnnounce);

app.post('/users/:username/undo', activityPubHeaders, postUndo);

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running at http://localhost:${process.env.PORT || 3000}`);
});
