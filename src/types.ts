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
  visibility: VisibilityType;
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

export type Update = {
  "@context": string;
  type: string;
  id: string;
  actor: string;
  published: string;
  object: Note;
  to: string[];
}

export type Delete = {
  "@context": string;
  type: string;
  id: string;
  actor: string;
  published: string;
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
  visibility: VisibilityType;
}

export enum VisibilityType {
  Public = 'public',
  Unlisted = 'unlisted',
  Followers = 'followers',
  Direct = 'direct'
}

export type ThreadParticipant = {
  thread_id: string;
  actor_id: string;
  last_read_at: string;
  muted: boolean;
  created_at: string;
}
