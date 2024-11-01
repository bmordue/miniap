import { Request, Response } from "express";
import { getOutbox } from "../collectionService";
import { getOutboxFromDB } from "../../dbService";

jest.mock("../../dbService");

describe("getOutbox", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      params: { username: "alice" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should return outbox data when found in database", async () => {
    const mockOutboxData = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "OrderedCollection",
      totalItems: 1,
      orderedItems: [
        {
          "@context": "https://www.w3.org/ns/activitystreams",
          type: "Create",
          id: "https://example.com/users/alice/notes/1",
          actor: "https://example.com/users/alice",
          published: "2023-01-01T00:00:00Z",
          to: ["https://www.w3.org/ns/activitystreams#Public"],
          object: {
            type: "Note",
            content: "Hello, World!",
          },
        },
      ],
    };

    (getOutboxFromDB as jest.Mock).mockResolvedValue(mockOutboxData);

    await getOutbox(req as Request, res as Response);

    expect(getOutboxFromDB).toHaveBeenCalledWith("alice");
    expect(res.json).toHaveBeenCalledWith(mockOutboxData);
  });

  it("should return 404 if user is not found", async () => {
    (getOutboxFromDB as jest.Mock).mockResolvedValue(null);

    await getOutbox(req as Request, res as Response);

    expect(getOutboxFromDB).toHaveBeenCalledWith("alice");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  it("should return 500 if database throws an error", async () => {
    const error = new Error("Database connection failed");
    (getOutboxFromDB as jest.Mock).mockRejectedValue(error);

    await getOutbox(req as Request, res as Response);

    expect(getOutboxFromDB).toHaveBeenCalledWith("alice");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
