import sqlite3 from "sqlite3";
import { open } from "sqlite";
import {
  addNoteToDB,
  updateNoteInDB,
  deleteNoteFromDB,
  getNoteFromDB,
} from "../dbService";
import { Note } from "../types";

jest.mock("sqlite3");
jest.mock("sqlite");

describe("Database Note Operations", () => {
  let mockDb: any;
  let mockNote: Note;

  beforeEach(() => {
    process.env.DB_FILENAME = ":memory:";
    mockDb = {
      run: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue({ id: "1" }),
    };

    (open as jest.Mock).mockResolvedValue(mockDb);

    mockNote = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "Note",
      id: "https://example.com/users/alice/notes/1",
      attributedTo: "https://example.com/users/alice",
      content: "Test content",
      published: "2023-01-01T00:00:00Z",
      to: ["https://www.w3.org/ns/activitystreams#Public"],
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("addNoteToDB", () => {
    it("should successfully add a note to the database", async () => {
      await addNoteToDB(mockNote);

      expect(mockDb.run).toHaveBeenCalledWith(
        "INSERT INTO notes (id, attributedTo, content, published, to) VALUES (?, ?, ?, ?, ?)",
        [
          mockNote.id,
          mockNote.attributedTo,
          mockNote.content,
          mockNote.published,
          JSON.stringify(mockNote.to),
        ],
      );
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      mockDb.run.mockRejectedValue(error);

      await expect(addNoteToDB(mockNote)).rejects.toThrow("Database error");
    });
  });

  describe("updateNoteInDB", () => {
    it("should successfully update a note in the database", async () => {
      await updateNoteInDB(mockNote);

      expect(mockDb.run).toHaveBeenCalledWith(
        "UPDATE notes SET content = ?, published = ?, to = ? WHERE id = ?",
        [
          mockNote.content,
          mockNote.published,
          JSON.stringify(mockNote.to),
          mockNote.id,
        ],
      );
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      mockDb.run.mockRejectedValue(error);

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
      mockDb.run.mockRejectedValue(error);

      await expect(deleteNoteFromDB("1")).rejects.toThrow("Database error");
    });
  });

  describe("getNoteFromDB", () => {
    it("should successfully retrieve a note from the database", async () => {
      const username = "alice";
      const mockNoteData = { ...mockNote };
      mockDb.get.mockResolvedValue(mockNoteData);

      const result = await getNoteFromDB(username);

      expect(mockDb.get).toHaveBeenCalledWith(
        "SELECT * FROM notes WHERE username = ?",
        [username],
      );
      expect(result).toEqual(mockNoteData);
    });

    it("should return null if note is not found", async () => {
      mockDb.get.mockResolvedValue(null);

      const result = await getNoteFromDB("alice");

      expect(result).toBeNull();
    });

    it("should throw an error if database operation fails", async () => {
      const error = new Error("Database error");
      mockDb.get.mockRejectedValue(error);

      await expect(getNoteFromDB("alice")).rejects.toThrow("Database error");
    });
  });
});
