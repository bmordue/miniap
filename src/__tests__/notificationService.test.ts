import { create_notification, process_activity_for_notifications, get_notifications, mark_notifications_as_read } from '../services/notificationService';
import { dbPromise } from '../dbService';

jest.mock('../dbService', () => ({
  dbPromise: {
    run: jest.fn(),
    all: jest.fn(),
  },
}));

describe('Notification Service', () => {
  describe('create_notification', () => {
    it('should create a notification in the database', async () => {
      const actor_id = 'actor1';
      const type = 'mention';
      const originating_actor = 'actor2';
      const reference = 'reference1';
      const data = { content: 'Test content' };

      await create_notification(actor_id, type, originating_actor, reference, data);

      expect(dbPromise.run).toHaveBeenCalledWith(
        'INSERT INTO notifications (id, actor_id, type, originating_actor_id, reference_id, created_at, data) VALUES (?, ?, ?, ?, ?, NOW(), ?)',
        [expect.any(String), actor_id, type, originating_actor, reference, data]
      );
    });
  });

  describe('process_activity_for_notifications', () => {
    it('should process mentions in a Create activity', async () => {
      const activity = {
        type: 'Create',
        actor: 'actor1',
        id: 'activity1',
        object: {
          content: 'Hello @user1 and @user2@example.com!',
        },
      };

      await process_activity_for_notifications(activity);

      expect(dbPromise.run).toHaveBeenCalledTimes(2);
      expect(dbPromise.run).toHaveBeenCalledWith(
        'INSERT INTO notifications (id, actor_id, type, originating_actor_id, reference_id, created_at, data) VALUES (?, ?, ?, ?, ?, NOW(), ?)',
        [expect.any(String), 'user1', 'mention', 'actor1', 'activity1', { content: 'Hello @user1 and @user2@example.com!' }]
      );
      expect(dbPromise.run).toHaveBeenCalledWith(
        'INSERT INTO notifications (id, actor_id, type, originating_actor_id, reference_id, created_at, data) VALUES (?, ?, ?, ?, ?, NOW(), ?)',
        [expect.any(String), 'user2@example.com', 'mention', 'actor1', 'activity1', { content: 'Hello @user1 and @user2@example.com!' }]
      );
    });

    it('should process replies in a Create activity', async () => {
      const activity = {
        type: 'Create',
        actor: 'actor1',
        id: 'activity1',
        object: {
          content: 'This is a reply',
          inReplyTo: 'post1',
        },
      };

      const original_post = {
        attributedTo: 'actor2',
      };

      (dbPromise.all as jest.Mock).mockResolvedValueOnce([original_post]);

      await process_activity_for_notifications(activity);

      expect(dbPromise.run).toHaveBeenCalledWith(
        'INSERT INTO notifications (id, actor_id, type, originating_actor_id, reference_id, created_at, data) VALUES (?, ?, ?, ?, ?, NOW(), ?)',
        [expect.any(String), 'actor2', 'reply', 'actor1', 'activity1', null]
      );
    });
  });

  describe('get_notifications', () => {
    it('should fetch notifications for an actor', async () => {
      const actor_id = 'actor1';
      const limit = 10;
      const offset = 0;

      const mockNotifications = [
        { id: 'notification1', actor_id: 'actor1', type: 'mention', originating_actor_id: 'actor2', reference_id: 'reference1', seen: false, created_at: '2023-01-01T00:00:00Z', data: { content: 'Test content' } },
        { id: 'notification2', actor_id: 'actor1', type: 'reply', originating_actor_id: 'actor3', reference_id: 'reference2', seen: false, created_at: '2023-01-02T00:00:00Z', data: null },
      ];

      (dbPromise.all as jest.Mock).mockResolvedValueOnce(mockNotifications);

      const notifications = await get_notifications(actor_id, limit, offset);

      expect(dbPromise.all).toHaveBeenCalledWith(
        'SELECT * FROM notifications WHERE actor_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [actor_id, limit, offset]
      );
      expect(notifications).toEqual(mockNotifications);
    });
  });

  describe('mark_notifications_as_read', () => {
    it('should mark notifications as read in the database', async () => {
      const notification_ids = ['notification1', 'notification2'];
      const actor_id = 'actor1';

      await mark_notifications_as_read(notification_ids, actor_id);

      expect(dbPromise.run).toHaveBeenCalledWith(
        'UPDATE notifications SET seen = true WHERE id = ANY(?) AND actor_id = ?',
        [notification_ids, actor_id]
      );
    });
  });
});
