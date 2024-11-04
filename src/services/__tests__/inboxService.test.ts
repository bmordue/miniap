import { Request, Response } from 'express';
import { postInbox } from '../inboxService';
import { getActorFromDB, addFollowerToDB } from '../../dbService';
import fetch from 'node-fetch';
import httpSignature from 'http-signature';

jest.mock('../../dbService');
jest.mock('node-fetch');
jest.mock('http-signature');

describe('postInbox', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      params: { username: 'alice' },
      body: {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "Follow",
        actor: {
          id: "https://example.com/users/bob",
          inbox: "https://example.com/users/bob/inbox"
        },
        object: "https://example.com/users/alice"
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('should send an Accept activity in response to a Follow activity', async () => {
    (getActorFromDB as jest.Mock).mockResolvedValue({
      id: "https://example.com/users/alice",
      inbox: "https://example.com/users/alice/inbox"
    });

    (httpSignature.verifySignature as jest.Mock).mockReturnValue(true);

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK'
    });

    await postInbox(req as Request, res as Response);

    expect(fetch).toHaveBeenCalledWith("https://example.com/users/bob/inbox", expect.objectContaining({
      method: 'POST',
      headers: {
        'Content-Type': 'application/activity+json'
      },
      body: expect.stringContaining('"type":"Accept"')
    }));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
  });

  it('should log the response status of the Accept activity', async () => {
    (getActorFromDB as jest.Mock).mockResolvedValue({
      id: "https://example.com/users/alice",
      inbox: "https://example.com/users/alice/inbox"
    });

    (httpSignature.verifySignature as jest.Mock).mockReturnValue(true);

    const consoleSpy = jest.spyOn(console, 'log');

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK'
    });

    await postInbox(req as Request, res as Response);

    expect(consoleSpy).toHaveBeenCalledWith('Accept activity sent successfully:', 200);

    consoleSpy.mockRestore();
  });
});