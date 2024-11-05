import { Request, Response } from 'express';
import { getUser, getFollowers, getFollowing } from '../userService';
import DbService from '../../dbService';
import httpSignature from 'http-signature';
import { open, Database } from 'sqlite';

jest.mock('../../dbService');
jest.mock('http-signature');

describe('userService', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let db :DbService;

  beforeEach(async () => {
    const dbPromise = open({
      filename: ':memory:',
      driver: Database
    });
    db = new DbService(await dbPromise);    req = {
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

      (db.getActorFromDB as jest.Mock).mockResolvedValue(mockUserData);

      await getUser(req as Request, res as Response);

      expect(db.getActorFromDB).toHaveBeenCalledWith('alice');
      expect(res.json).toHaveBeenCalledWith(mockUserData);
    });

    it('should return 404 if user is not found', async () => {
      (db.getActorFromDB as jest.Mock).mockResolvedValue(null);

      await getUser(req as Request, res as Response);

      expect(db.getActorFromDB).toHaveBeenCalledWith('alice');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should return 500 if database throws an error', async () => {
      const error = new Error('Database connection failed');
      (db.getActorFromDB as jest.Mock).mockRejectedValue(error);

      await getUser(req as Request, res as Response);

      expect(db.getActorFromDB).toHaveBeenCalledWith('alice');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });

    it('should sign the outgoing activity', async () => {
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

      (db.getActorFromDB as jest.Mock).mockResolvedValue(mockUserData);

      await getUser(req as Request, res as Response);

      expect(httpSignature.sign).toHaveBeenCalled();
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

      (db.getFollowersFromDB as jest.Mock).mockResolvedValue(mockFollowersData);

      await getFollowers(req as Request, res as Response);

      expect(db.getFollowersFromDB).toHaveBeenCalledWith('alice');
      expect(res.json).toHaveBeenCalledWith(mockFollowersData);
    });

    it('should return 404 if followers are not found', async () => {
      (db.getFollowersFromDB as jest.Mock).mockResolvedValue(null);

      await getFollowers(req as Request, res as Response);

      expect(db.getFollowersFromDB).toHaveBeenCalledWith('alice');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should return 500 if database throws an error', async () => {
      const error = new Error('Database connection failed');
      (db.getFollowersFromDB as jest.Mock).mockRejectedValue(error);

      await getFollowers(req as Request, res as Response);

      expect(db.getFollowersFromDB).toHaveBeenCalledWith('alice');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });

    it('should sign the outgoing activity', async () => {
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

      (db.getFollowersFromDB as jest.Mock).mockResolvedValue(mockFollowersData);

      await getFollowers(req as Request, res as Response);

      expect(httpSignature.sign).toHaveBeenCalled();
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

      (db.getFollowingFromDB as jest.Mock).mockResolvedValue(mockFollowingData);

      await getFollowing(req as Request, res as Response);

      expect(db.getFollowingFromDB).toHaveBeenCalledWith('alice');
      expect(res.json).toHaveBeenCalledWith(mockFollowingData);
    });

    it('should return 404 if following are not found', async () => {
      (db.getFollowingFromDB as jest.Mock).mockResolvedValue(null);

      await getFollowing(req as Request, res as Response);

      expect(db.getFollowingFromDB).toHaveBeenCalledWith('alice');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should return 500 if database throws an error', async () => {
      const error = new Error('Database connection failed');
      (db.getFollowingFromDB as jest.Mock).mockRejectedValue(error);

      await getFollowing(req as Request, res as Response);

      expect(db.getFollowingFromDB).toHaveBeenCalledWith('alice');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });

    it('should sign the outgoing activity', async () => {
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

      (db.getFollowingFromDB as jest.Mock).mockResolvedValue(mockFollowingData);

      await getFollowing(req as Request, res as Response);

      expect(httpSignature.sign).toHaveBeenCalled();
    });
  });
});
