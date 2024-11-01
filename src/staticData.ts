import { BASE_URL, USERNAME } from './constants';
import { Actor, Note, Create, OrderedCollection } from './types';

export const actor: Actor = {
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
  name: "Alice"
};

export const note: Note = {
  "@context": "https://www.w3.org/ns/activitystreams",
  type: "Note",
  id: `${BASE_URL}/notes/1`,
  attributedTo: BASE_URL,
  content: "Hello, ActivityPub world! This is a static note in my outbox.",
  published: "2024-01-01T00:00:00Z",
  to: ["https://www.w3.org/ns/activitystreams#Public"]
};

export const createActivity: Create = {
  "@context": "https://www.w3.org/ns/activitystreams",
  type: "Create",
  id: `${BASE_URL}/create/1`,
  actor: BASE_URL,
  published: "2024-01-01T00:00:00Z",
  object: note,
  to: ["https://www.w3.org/ns/activitystreams#Public"]
};

export const outboxCollection: OrderedCollection = {
  "@context": "https://www.w3.org/ns/activitystreams",
  type: "OrderedCollection",
  totalItems: 1,
  orderedItems: [createActivity]
};

export const emptyCollection: OrderedCollection = {
  "@context": "https://www.w3.org/ns/activitystreams",
  type: "OrderedCollection",
  totalItems: 0,
  orderedItems: []
};
