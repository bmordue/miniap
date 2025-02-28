import { Request, Response } from "express";
import InboxService from "../inboxService";
import DbService from "../dbService";
import fetch from "node-fetch";
import httpSignature from "http-signature";
import { open, Database } from 'sqlite';

jest.mock("../dbService");
jest.mock("node-fetch");
jest.mock("http-signature");

const aliceInbox = "https://example.com/users/alice/inbox";

describe.skip("postInbox", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let db: DbService;
  let inboxService :InboxService;

  beforeEach(async () => {
    const dbPromise = open({
      filename: ':memory:',
      driver: Database
    });
    db = new DbService(await dbPromise);
    req = {
      params: { username: "alice" },
      body: {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "Follow",
        actor: {
          id: "https://example.com/users/bob",
          inbox: "https://example.com/users/bob/inbox",
        },
        object: "https://example.com/users/alice",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    inboxService = new InboxService(db);
  });

  it("should identify valid inbox URL", () => {
    expect(inboxService.isValidUrl(aliceInbox)).toBe(true);
  });

  it("should send an Accept activity in response to a Follow activity", async () => {
    (db.getActorFromDB as jest.Mock).mockResolvedValue({
      id: "https://example.com/users/alice",
      inbox: aliceInbox,
    });

    (httpSignature.verifySignature as jest.Mock).mockReturnValue(true);

    (fetch as unknown as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
    });

    await inboxService.postInbox(req as Request, res as Response);

    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/users/bob/inbox",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/activity+json",
        },
        body: expect.stringContaining('"type":"Accept"'),
      })
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: "ok" });
  });

  it("should log the response status of the Accept activity", async () => {
    (db.getActorFromDB as jest.Mock).mockResolvedValue({
      id: "https://example.com/users/alice",
      inbox: "https://example.com/users/alice/inbox",
    });

    (httpSignature.verifySignature as jest.Mock).mockReturnValue(true);

    const consoleSpy = jest.spyOn(console, "log");

    (fetch as unknown as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
    });

    await inboxService.postInbox(req as Request, res as Response);
    expect(consoleSpy).toHaveBeenLastCalledWith("Activity sent successfully:", 200);

    consoleSpy.mockRestore();
  });

  it.skip("should sign the outgoing activity", async () => {

    (httpSignature.verifySignature as jest.Mock).mockReturnValue(true);

    (fetch as unknown as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
    });

    await inboxService.postInbox(req as Request, res as Response);

    expect(httpSignature.sign).toHaveBeenCalled();
  });

  it("should add a Like activity to the database", async () => {
    req.body = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "Like",
      actor: "https://example.com/users/alice",
      object: "https://example.com/users/bob/posts/1",
      id: "https://example.com/users/alice/activities/1",
    };

    (db.getActorFromDB as jest.Mock).mockResolvedValue({
      id: "https://example.com/users/alice",
      inbox: aliceInbox,
    });

    (httpSignature.verifySignature as jest.Mock).mockReturnValue(true);

    await inboxService.postInbox(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: "ok" });
  });

  it("should add an Announce activity to the database", async () => {
    req.body = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "Announce",
      actor: "https://example.com/users/alice",
      object: "https://example.com/users/bob/posts/1",
      id: "https://example.com/users/alice/activities/1",
    };

    (db.getActorFromDB as jest.Mock).mockResolvedValue({
      id: "https://example.com/users/alice",
      inbox: aliceInbox,
    });

    (httpSignature.verifySignature as jest.Mock).mockReturnValue(true);

    await inboxService.postInbox(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: "ok" });
  });

  it("should process an Undo activity for a Like", async () => {
    req.body = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "Undo",
      actor: "https://example.com/users/alice",
      object: {
        type: "Like",
        id: "https://example.com/users/alice/activities/1",
        actor: "https://example.com/users/alice",
        object: "https://example.com/users/bob/posts/1",
      },
    };

    (db.getActorFromDB as jest.Mock).mockResolvedValue({
      id: "https://example.com/users/alice",
      inbox: aliceInbox,
    });

    (httpSignature.verifySignature as jest.Mock).mockReturnValue(true);

    await inboxService.postInbox(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: "ok" });
  });

  it("should process an Undo activity for an Announce", async () => {
    req.body = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "Undo",
      actor: "https://example.com/users/alice",
      object: {
        type: "Announce",
        id: "https://example.com/users/alice/activities/1",
        actor: "https://example.com/users/alice",
        object: "https://example.com/users/bob/posts/1",
      },
    };

    (db.getActorFromDB as jest.Mock).mockResolvedValue({
      id: "https://example.com/users/alice",
      inbox: aliceInbox,
    });

    (httpSignature.verifySignature as jest.Mock).mockReturnValue(true);

    await inboxService.postInbox(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: "ok" });
  });
});

describe.skip("distributeActivity", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let inboxService :InboxService;

  beforeEach(async () => {
    process.env.DB_FILENAME = ":memory:";
    req = {
      params: { username: "alice" },
      body: {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "Create",
        actor: "https://example.com/users/alice",
        object: {
          type: "Note",
          content: "Hello, World!",
        },
        to: ["https://www.w3.org/ns/activitystreams#Public"],
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const dbPromise = open({
      filename: ':memory:',
      driver: Database
    });
    const db = new DbService(await dbPromise);

    inboxService = new InboxService(db);
  });

  it("should distribute activity to followers with matching visibility", async () => {
    const mockFollowers = [
      {
        id: "https://example.com/users/bob",
        inbox: "https://example.com/users/bob/inbox",
        visibility: "https://www.w3.org/ns/activitystreams#Public",
      },
    ];

    // (getFollowersWithVisibilityFromDB as jest.Mock).mockResolvedValue(mockFollowers);

    (fetch as unknown as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
    });

    await inboxService.distributeActivity(req as Request, res as Response);

    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/users/bob/inbox",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/activity+json",
        },
        body: expect.stringContaining('"type":"Create"'),
      })
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: "ok" });
  });

  it.skip("should handle delivery failure", async () => {
    const mockFollowers = [
      {
        id: "https://example.com/users/bob",
        inbox: "https://example.com/users/bob/inbox",
        visibility: "https://www.w3.org/ns/activitystreams#Public",
      },
    ];

    // (getFollowersWithVisibilityFromDB as jest.Mock).mockResolvedValue(mockFollowers);

    (fetch as unknown as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await inboxService.distributeActivity(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: "ok" });
  });
});

describe("notifyFollowers", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let inboxService :InboxService;

  beforeEach(async () => {
    process.env.DB_FILENAME = ":memory:";
    req = {
      params: { username: "alice" },
      body: {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "Create",
        actor: "https://example.com/users/alice",
        object: {
          type: "Note",
          content: "Hello, World!",
        },
        to: ["https://www.w3.org/ns/activitystreams#Public"],
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const dbPromise = open({
      filename: ':memory:',
      driver: Database
    });
    const db = new DbService(await dbPromise);

    inboxService = new InboxService(db);
  });

  it.skip("should notify followers of new activity", async () => {
    const mockFollowers = [
      {
        id: "https://example.com/users/bob",
        inbox: "https://example.com/users/bob/inbox",
        visibility: "https://www.w3.org/ns/activitystreams#Public",
      },
    ];

    // (getFollowersWithVisibilityFromDB as jest.Mock).mockResolvedValue(mockFollowers);

    (fetch as unknown as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
    });

    await inboxService.distributeActivity(req as Request, res as Response);

    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/users/bob/inbox",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/activity+json",
        },
        body: expect.stringContaining('"type":"Create"'),
      })
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: "ok" });
  });

  it.skip("should handle delivery failure", async () => {
    const mockFollowers = [
      {
        id: "https://example.com/users/bob",
        inbox: "https://example.com/users/bob/inbox",
        visibility: "https://www.w3.org/ns/activitystreams#Public",
      },
    ];

    // (getFollowersWithVisibilityFromDB as jest.Mock).mockResolvedValue(mockFollowers);

    (fetch as unknown as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await inboxService.distributeActivity(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: "ok" });
  });
});
