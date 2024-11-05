import { dbPromise } from '../dbService';
import uuid from 'uuid';

export const create_notification = async (actor_id: string, type: string, originating_actor: string, reference: string, data: any = null): Promise<void> => {
  const db = await dbPromise;
  await db.run(
    'INSERT INTO notifications (id, actor_id, type, originating_actor_id, reference_id, created_at, data) VALUES (?, ?, ?, ?, ?, NOW(), ?)',
    [uuid.v4(), actor_id, type, originating_actor, reference, data]
  );
};

export const process_activity_for_notifications = async (activity: any): Promise<void> => {
  if (activity.type === 'Create') {
    const mentions = parse_mentions(activity.object.content);
    for (const mention of mentions) {
      await create_notification(
        mention.id,
        'mention',
        activity.actor,
        activity.id,
        { content: activity.object.content }
      );
    }

    if (activity.inReplyTo) {
      const original_post = await fetch_post(activity.object.inReplyTo);
      await create_notification(
        original_post.attributedTo,
        'reply',
        activity.actor,
        activity.id
      );
    }
  }
};

export const get_notifications = async (actor_id: string, limit: number = 20, offset: number = 0): Promise<any[]> => {
  const db = await dbPromise;
  return await db.all(
    'SELECT * FROM notifications WHERE actor_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [actor_id, limit, offset]
  );
};

export const mark_notifications_as_read = async (notification_ids: string[], actor_id: string): Promise<void> => {
  const db = await dbPromise;
  await db.run(
    'UPDATE notifications SET seen = true WHERE id = ANY(?) AND actor_id = ?',
    [notification_ids, actor_id]
  );
};
