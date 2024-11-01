import { Request, Response, NextFunction } from "express";
import * as httpSignature from "http-signature";
import verifySignature from "../verifySignature";
import { getPublicKey } from "../../services/userService";

jest.mock("http-signature");
jest.mock("../../services/userService", () => ({
  getPublicKey: jest.fn().mockResolvedValue("mock-public-key"),
}));

describe("verifySignature middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should pass verification with valid signature", () => {
    // Mock successful signature parsing and verification
    (httpSignature.parseRequest as jest.Mock).mockReturnValue({
      keyId: "test-key",
      algorithm: "rsa-sha256",
      signature: "valid-signature",
    });
    (httpSignature.verifySignature as jest.Mock).mockReturnValue(true);

    verifySignature(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it("should return 400 when public key is missing", async () => {
    // Mock getPublicKey to return null
    (getPublicKey as jest.Mock).mockResolvedValueOnce(null);

    await verifySignature(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "Public key not found",
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it("should return 401 when signature is invalid", () => {
    // Mock successful parsing but failed verification
    (httpSignature.parseRequest as jest.Mock).mockReturnValue({
      keyId: "test-key",
      algorithm: "rsa-sha256",
      signature: "invalid-signature",
    });
    (httpSignature.verifySignature as jest.Mock).mockReturnValue(false);

    verifySignature(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "Invalid signature",
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it("should return 400 when request format is invalid", () => {
    // Mock parsing error
    (httpSignature.parseRequest as jest.Mock).mockImplementation(() => {
      throw new Error("Invalid request format");
    });

    verifySignature(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "Signature verification failed",
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
