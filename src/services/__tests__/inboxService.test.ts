import { Request, Response } from 'express';
import { postInbox } from '../inboxService';
import { getActorFromDB, addFollowerToDB } from '../../dbService';
import httpSignature from 'http-signature';

jest.mock('../../dbService');
jest.mock('http-signature');

describe('postInbox', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      params: { username: 'alice' },
      body: {
        type: 'Follow',
        actor: {
          id: 'https://example.com/users/bob',
          inbox: 'https://example.com/users/bob/inbox'
        }
      },
      headers: {
        authorization: 'Signature keyId="test-key",algorithm="rsa-sha256",headers="(request-target) host date",signature="test-signature"'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('should respond with 401 if signature verification fails', async () => {
    (httpSignature.parseRequest as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    await postInbox(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should process the request if signature verification succeeds', async () => {
    (httpSignature.parseRequest as jest.Mock).mockReturnValue({
      keyId: 'test-key',
      headers: {},
      method: 'POST',
      url: '/users/alice/inbox'
    });
    (httpSignature.verifySignature as jest.Mock).mockReturnValue(true);
    (getActorFromDB as jest.Mock).mockResolvedValue({
      id: 'https://example.com/users/alice',
      inbox: 'https://example.com/users/alice/inbox',
      outbox: 'https://example.com/users/alice/outbox',
      following: 'https://example.com/users/alice/following',
      followers: 'https://example.com/users/alice/followers',
      preferredUsername: 'alice',
      name: 'Alice'
    });

    await postInbox(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
  });
});
