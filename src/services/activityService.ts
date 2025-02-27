import { Request, Response } from "express";
import DbService from "./dbService";

class ActivityService {
  dbService: DbService;

  constructor(dbService: DbService) {
    this.dbService = dbService;
  }

  public async postLike(req: Request, res: Response): Promise<void> {
    const { actor, object, id } = req.body;

    try {
      await this.dbService.addLikeToDB(actor, object, id);
      res.status(201).json({ status: "Like added" });
    } catch (error) {
      console.error("Error adding like to database:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  public async postAnnounce(req: Request, res: Response): Promise<void> {
    const { actor, object, id } = req.body;

    try {
      await this.dbService.addAnnounceToDB(actor, object, id);
      res.status(201).json({ status: "Announce added" });
    } catch (error) {
      console.error("Error adding announce to database:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  public async postUndo(req: Request, res: Response): Promise<void> {
    const { actor, object } = req.body;

    try {
      if (object.type === "Like") {
        await this.dbService.removeLikeFromDB(actor, object.id);
        res.status(200).json({ status: "Like removed" });
      } else if (object.type === "Announce") {
        await this.dbService.removeAnnounceFromDB(actor, object.id);
        res.status(200).json({ status: "Announce removed" });
      } else {
        res.status(400).json({ error: "Invalid activity type" });
      }
    } catch (error) {
      console.error("Error processing undo activity:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default ActivityService;