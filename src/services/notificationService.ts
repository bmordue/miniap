import DbService from './dbService';
import uuid from 'uuid';
import { open, Database } from 'sqlite';
import { parse_mentions } from './mentionService';

export const process_activity_for_notifications = async (activity: any): Promise<void> => {
  const dbService = new DbService(await open({
    filename: '../activitypub.db',
    driver: Database
  }));

  if (activity.type === 'Create') {
    const mentions = parse_mentions(activity.object.content);
    for (const mention of mentions) {
      await dbService.createNotification(
        activity.author,
        'mention',
        activity.actor,
        activity.id,
        { content: activity.object.content }
      );
    }

    if (activity.inReplyTo) {
      const original_post = await dbService.getNoteFromDB(activity.object.inReplyTo);
      if (!original_post) {
        return;
      }
      await dbService.createNotification(
        original_post.attributedTo,
        'reply',
        activity.actor,
        activity.id
      );
    }
  }
};
