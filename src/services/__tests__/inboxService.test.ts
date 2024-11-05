import { Request, Response } from "express";
import { isValidUrl, postInbox, distributeActivity, handleDeliveryFailure } from "../inboxService";
import { getActorFromDB, getFollowersWithVisibilityFromDB, logDeliveryFailure } from "../../dbService";
import fetch from "node-fetch";
import httpSignature from "http-signature";

jest.mock("../../dbService");
jest.mock("node-fetch");
jest.mock("http-signature");

const aliceInbox = "https://example.com/users/alice/inbox";

describe("postInbox", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    process.env.DB_FILENAME = ":memory:";
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
  });

  it("should identify valid inbox URL", () => {
    expect(isValidUrl(aliceInbox)).toBe(true);
  });

  it("should send an Accept activity in response to a Follow activity", async () => {
    (getActorFromDB as jest.Mock).mockResolvedValue({
      id: "https://example.com/users/alice",
      inbox: aliceInbox,
    });

    (httpSignature.verifySignature as jest.Mock).mockReturnValue(true);

    (fetch as unknown as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
    });

    await postInbox(req as Request, res as Response);

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
    (getActorFromDB as jest.Mock).mockResolvedValue({
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

    await postInbox(req as Request, res as Response);
    expect(consoleSpy).toHaveBeenLastCalledWith("Activity sent successfully:", 200);

    consoleSpy.mockRestore();
  });

  it.skip("should sign the outgoing activity", async () => {
    (getActorFromDB as jest.Mock).mockResolvedValue({
      id: "https://example.com/users/alice",
      inbox: aliceInbox,
    });

    (httpSignature.verifySignature as jest.Mock).mockReturnValue(true);

    (fetch as unknown as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
    });

    await postInbox(req as Request, res as Response);

    expect(httpSignature.sign).toHaveBeenCalled();
  });
});

describe("distributeActivity", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
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
  });

  it("should distribute activity to followers with matching visibility", async () => {
    const mockFollowers = [
      {
        id: "https://example.com/users/bob",
        inbox: "https://example.com/users/bob/inbox",
        visibility: "https://www.w3.org/ns/activitystreams#Public",
      },
    ];

    (getFollowersWithVisibilityFromDB as jest.Mock).mockResolvedValue(mockFollowers);

    (fetch as unknown as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
    });

    await distributeActivity(req as Request, res as Response);

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

  it("should handle delivery failure", async () => {
    const mockFollowers = [
      {
        id: "https://example.com/users/bob",
        inbox: "https://example.com/users/bob/inbox",
        visibility: "https://www.w3.org/ns/activitystreams#Public",
      },
    ];

    (getFollowersWithVisibilityFromDB as jest.Mock).mockResolvedValue(mockFollowers);

    (fetch as unknown as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await distributeActivity(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: "ok" });
  });
});

describe("notifyFollowers", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
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
  });

  it("should notify followers of new activity", async () => {
    const mockFollowers = [
      {
        id: "https://example.com/users/bob",
        inbox: "https://example.com/users/bob/inbox",
        visibility: "https://www.w3.org/ns/activitystreams#Public",
      },
    ];

    (getFollowersWithVisibilityFromDB as jest.Mock).mockResolvedValue(mockFollowers);

    (fetch as unknown as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
    });

    await distributeActivity(req as Request, res as Response);

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

  it("should handle delivery failure", async () => {
    const mockFollowers = [
      {
        id: "https://example.com/users/bob",
        inbox: "https://example.com/users/bob/inbox",
        visibility: "https://www.w3.org/ns/activitystreams#Public",
      },
    ];

    (getFollowersWithVisibilityFromDB as jest.Mock).mockResolvedValue(mockFollowers);

    (fetch as unknown as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await distributeActivity(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: "ok" });
  });
});
