import { dbPromise } from '../dbService';
import { getLocalActor, webfingerLookup, isLocalUser } from './utils';
import uuid from 'uuid';
import * as re from 're';

export const parse_mentions = (content: string): string[] => {
  const mention_pattern = /@([a-zA-Z0-9_]+(@[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])?)/g;
  const mentions = content.match(mention_pattern) || [];
  return mentions.map(mention => normalize_mention(mention));
};

export const resolve_mentions = async (mentions: string[]): Promise<any[]> => {
  const resolved = [];
  for (const mention of mentions) {
    let actor;
    if (isLocalUser(mention)) {
      actor = await getLocalActor(mention);
    } else {
      actor = await webfingerLookup(mention);
    }
    if (actor) {
      resolved.push(actor);
    }
  }
  return resolved;
};

export const store_mention = async (post_id: string, mentioned_actor: string, mentioner: string): Promise<void> => {
  const db = await dbPromise;
  await db.run(
    'INSERT INTO mentions (id, post_id, mentioned_actor_id, mentioner_id, created_at) VALUES (?, ?, ?, ?, NOW())',
    [uuid.v4(), post_id, mentioned_actor, mentioner]
  );
};
