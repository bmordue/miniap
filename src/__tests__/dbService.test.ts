import sqlite3 from "sqlite3";
import { open } from "sqlite";
import {
  addNoteToDB,
  updateNoteInDB,
  deleteNoteFromDB,
  getNoteFromDB,
} from "../dbService";
import { Note, VisibilityType } from "../types";

// Mock the database modules
jest.mock("sqlite3");
jest.mock("sqlite", () => ({
  open: jest.fn(),
}));

// Create a mock database instance
const mockDb = {
  run: jest.fn(),
  get: jest.fn(),
};

// Mock the open function to return our mock database
(open as jest.Mock).mockResolvedValue(mockDb);

describe.skip("Database Note Operations", () => {
  let mockNote: Note;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    process.env.DB_FILENAME = ":memory:";

    // Reset mock implementations
    mockDb.run.mockResolvedValue(undefined);
    mockDb.get.mockResolvedValue({ id: "1" });

    mockNote = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "Note",
      id: "https://example.com/users/alice/notes/1",
      attributedTo: "https://example.com/users/alice",
      content: "Test content",
      published: "2023-01-01T00:00:00Z",
      to: ["https://www.w3.org/ns/activitystreams#Public"],
      visibility: VisibilityType.Public,
    };
  });

  describe("addNoteToDB", () => {
    it("should successfully add a note to the database", async () => {
      await addNoteToDB(mockNote);

      expect(mockDb.run).toHaveBeenCalledWith(
        "INSERT INTO notes (id, attributedTo, content, published, to, visibility) VALUES (?, ?, ?, ?, ?, ?)",
        [
          mockNote.id,
          mockNote.attributedTo,
          mockNote.content,
          mockNote.published,
          JSON.stringify(mockNote.to),
          mockNote.visibility,
        ],
      );
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      mockDb.run.mockRejectedValueOnce(error);

      await expect(addNoteToDB(mockNote)).rejects.toThrow("Database error");
    });
  });

  describe("updateNoteInDB", () => {
    it("should successfully update a note in the database", async () => {
      await updateNoteInDB(mockNote);

      expect(mockDb.run).toHaveBeenCalledWith(
        "UPDATE notes SET content = ?, published = ?, to = ?, visibility = ? WHERE id = ?",
        [
          mockNote.content,
          mockNote.published,
          JSON.stringify(mockNote.to),
          mockNote.visibility,
          mockNote.id,
        ],
      );
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      mockDb.run.mockRejectedValueOnce(error);

      await expect(updateNoteInDB(mockNote)).rejects.toThrow("Database error");
    });
  });

  describe("deleteNoteFromDB", () => {
    it("should successfully delete a note from the database", async () => {
      const noteId = "1";
      await deleteNoteFromDB(noteId);

      expect(mockDb.run).toHaveBeenCalledWith(
        "DELETE FROM notes WHERE id = ?",
        [noteId],
      );
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      mockDb.run.mockRejectedValueOnce(error);

      await expect(deleteNoteFromDB("1")).rejects.toThrow("Database error");
    });
  });

  describe("getNoteFromDB", () => {
    it("should successfully retrieve a note from the database", async () => {
      const username = "alice";
      const mockNoteData = { ...mockNote };
      mockDb.get.mockResolvedValueOnce(mockNoteData);

      const result = await getNoteFromDB(username);

      expect(mockDb.get).toHaveBeenCalledWith(
        "SELECT * FROM notes WHERE username = ?",
        [username],
      );
      expect(result).toEqual(mockNoteData);
    });

    it("should return null if note is not found", async () => {
      mockDb.get.mockResolvedValueOnce(null);

      const result = await getNoteFromDB("alice");

      expect(result).toBeNull();
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      mockDb.get.mockRejectedValueOnce(error);

      await expect(getNoteFromDB("alice")).rejects.toThrow("Database error");
    });
  });
});
