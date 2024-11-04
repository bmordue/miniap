import { Request, Response } from 'express';
import { getUser, getFollowers, getFollowing } from '../userService';
import { getActorFromDB, getFollowersFromDB, getFollowingFromDB } from '../../dbService';

jest.mock('../../dbService');

describe('userService', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    process.env.DB_FILENAME = ":memory:";
    req = {
      params: { username: 'alice' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('getUser', () => {
    it('should return user data when found in database', async () => {
      const mockUserData = {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        type: "Person",
        id: "https://example.com/users/alice",
        preferredUsername: "alice",
        name: "Alice",
        inbox: "https://example.com/users/alice/inbox",
        outbox: "https://example.com/users/alice/outbox",
        following: "https://example.com/users/alice/following",
        followers: "https://example.com/users/alice/followers"
      };

      (getActorFromDB as jest.Mock).mockResolvedValue(mockUserData);

      await getUser(req as Request, res as Response);

      expect(getActorFromDB).toHaveBeenCalledWith('alice');
      expect(res.json).toHaveBeenCalledWith(mockUserData);
    });

    it('should return 404 if user is not found', async () => {
      (getActorFromDB as jest.Mock).mockResolvedValue(null);

      await getUser(req as Request, res as Response);

      expect(getActorFromDB).toHaveBeenCalledWith('alice');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should return 500 if database throws an error', async () => {
      const error = new Error('Database connection failed');
      (getActorFromDB as jest.Mock).mockRejectedValue(error);

      await getUser(req as Request, res as Response);

      expect(getActorFromDB).toHaveBeenCalledWith('alice');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('getFollowers', () => {
    it('should return followers data when found in database', async () => {
      const mockFollowersData = {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "OrderedCollection",
        totalItems: 1,
        orderedItems: [
          {
            type: "Person",
            id: "https://example.com/users/bob",
            preferredUsername: "bob",
            name: "Bob"
          }
        ]
      };

      (getFollowersFromDB as jest.Mock).mockResolvedValue(mockFollowersData);

      await getFollowers(req as Request, res as Response);

      expect(getFollowersFromDB).toHaveBeenCalledWith('alice');
      expect(res.json).toHaveBeenCalledWith(mockFollowersData);
    });

    it('should return 404 if followers are not found', async () => {
      (getFollowersFromDB as jest.Mock).mockResolvedValue(null);

      await getFollowers(req as Request, res as Response);

      expect(getFollowersFromDB).toHaveBeenCalledWith('alice');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should return 500 if database throws an error', async () => {
      const error = new Error('Database connection failed');
      (getFollowersFromDB as jest.Mock).mockRejectedValue(error);

      await getFollowers(req as Request, res as Response);

      expect(getFollowersFromDB).toHaveBeenCalledWith('alice');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('getFollowing', () => {
    it('should return following data when found in database', async () => {
      const mockFollowingData = {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "OrderedCollection",
        totalItems: 1,
        orderedItems: [
          {
            type: "Person",
            id: "https://example.com/users/charlie",
            preferredUsername: "charlie",
            name: "Charlie"
          }
        ]
      };

      (getFollowingFromDB as jest.Mock).mockResolvedValue(mockFollowingData);

      await getFollowing(req as Request, res as Response);

      expect(getFollowingFromDB).toHaveBeenCalledWith('alice');
      expect(res.json).toHaveBeenCalledWith(mockFollowingData);
    });

    it('should return 404 if following are not found', async () => {
      (getFollowingFromDB as jest.Mock).mockResolvedValue(null);

      await getFollowing(req as Request, res as Response);

      expect(getFollowingFromDB).toHaveBeenCalledWith('alice');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should return 500 if database throws an error', async () => {
      const error = new Error('Database connection failed');
      (getFollowingFromDB as jest.Mock).mockRejectedValue(error);

      await getFollowing(req as Request, res as Response);

      expect(getFollowingFromDB).toHaveBeenCalledWith('alice');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});
