import { parse_mentions, resolve_mentions, store_mention } from '../services/mentionService';
import { dbPromise } from '../dbService';

jest.mock('../dbService', () => ({
  dbPromise: {
    run: jest.fn(),
  },
}));

describe('Mention Service', () => {
  describe('parse_mentions', () => {
    it('should parse mentions from content', () => {
      const content = 'Hello @user1 and @user2@example.com!';
      const mentions = parse_mentions(content);
      expect(mentions).toEqual(['@user1', '@user2@example.com']);
    });

    it('should return an empty array if no mentions are found', () => {
      const content = 'Hello world!';
      const mentions = parse_mentions(content);
      expect(mentions).toEqual([]);
    });
  });

  describe('resolve_mentions', () => {
    it('should resolve mentions to actors', async () => {
      const mentions = ['@user1', '@user2@example.com'];
      const resolvedActors = await resolve_mentions(mentions);
      expect(resolvedActors).toEqual([
        { id: 'https://example.com/users/user1' },
        { id: 'https://example.com/users/user2' },
      ]);
    });

    it('should return an empty array if no actors are resolved', async () => {
      const mentions = ['@unknown'];
      const resolvedActors = await resolve_mentions(mentions);
      expect(resolvedActors).toEqual([]);
    });
  });

  describe('store_mention', () => {
    it('should store a mention in the database', async () => {
      const post_id = 'post1';
      const mentioned_actor = 'https://example.com/users/user1';
      const mentioner = 'https://example.com/users/user2';

      await store_mention(post_id, mentioned_actor, mentioner);

      expect(dbPromise.run).toHaveBeenCalledWith(
        'INSERT INTO mentions (id, post_id, mentioned_actor_id, mentioner_id, created_at) VALUES (?, ?, ?, ?, NOW())',
        [expect.any(String), post_id, mentioned_actor, mentioner]
      );
    });
  });
});
