export type Actor = {
  "@context": string[];
  type: string;
  id: string;
  inbox: string;
  outbox: string;
  following: string;
  followers: string;
  preferredUsername: string;
  name: string;
}

export type OrderedCollection = {
  "@context": string;
  type: string;
  totalItems: number;
  orderedItems: any[];
}

export type Note = {
  "@context": string;
  type: string;
  id: string;
  attributedTo: string;
  content: string;
  published: string;
  to: string[];
}

export type Create = {
  "@context": string;
  type: string;
  id: string;
  actor: string;
  published: string;
  object: Note;
  to: string[];
}

// Database schema definitions

export type ActorDB = {
  id: string;
  preferredUsername: string;
  name: string;
  inbox: string;
  outbox: string;
  following: string;
  followers: string;
}

export type FollowerDB = {
  username: string;
  follower: string;
}

export type FollowingDB = {
  username: string;
  following: string;
}

export type OutboxDB = {
  username: string;
  outbox: OrderedCollection;
}

export type NoteDB = {
  id: string;
  attributedTo: string;
  content: string;
  published: string;
  to: string[];
}

export type FollowerWithVisibility = {
  id: string;
  inbox: string;
  visibility: string;
}

export type DeliveryFailure = {
  username: string;
  activityId: string;
  error: string;
}
