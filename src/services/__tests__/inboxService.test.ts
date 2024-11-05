import { Request, Response } from "express";
import { isValidUrl, postInbox } from "../inboxService";
import { getActorFromDB } from "../../dbService";
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
    expect(consoleSpy).toHaveBeenLastCalledWith("Accept activity sent successfully:", 200);

    consoleSpy.mockRestore();
  });

  it("should sign the outgoing activity", async () => {
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

  it("should add a Like activity to the database", async () => {
    req.body = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "Like",
      actor: "https://example.com/users/alice",
      object: "https://example.com/users/bob/posts/1",
      id: "https://example.com/users/alice/activities/1",
    };

    (getActorFromDB as jest.Mock).mockResolvedValue({
      id: "https://example.com/users/alice",
      inbox: aliceInbox,
    });

    (httpSignature.verifySignature as jest.Mock).mockReturnValue(true);

    await postInbox(req as Request, res as Response);

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

    (getActorFromDB as jest.Mock).mockResolvedValue({
      id: "https://example.com/users/alice",
      inbox: aliceInbox,
    });

    (httpSignature.verifySignature as jest.Mock).mockReturnValue(true);

    await postInbox(req as Request, res as Response);

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

    (getActorFromDB as jest.Mock).mockResolvedValue({
      id: "https://example.com/users/alice",
      inbox: aliceInbox,
    });

    (httpSignature.verifySignature as jest.Mock).mockReturnValue(true);

    await postInbox(req as Request, res as Response);

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

    (getActorFromDB as jest.Mock).mockResolvedValue({
      id: "https://example.com/users/alice",
      inbox: aliceInbox,
    });

    (httpSignature.verifySignature as jest.Mock).mockReturnValue(true);

    await postInbox(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: "ok" });
  });
});
