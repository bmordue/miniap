import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { json } from 'body-parser';
import { getUser, getFollowers, getFollowing } from './services/userService';
import { getOutbox } from './services/collectionService';
import { getNote } from './services/noteService';
import { postInbox } from './services/inboxService';

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

app.post('/users/:username/inbox', limiter, activityPubHeaders, postInbox);

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running at http://localhost:${process.env.PORT || 3000}`);
});
