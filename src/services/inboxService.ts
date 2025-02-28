import { Request, Response } from "express";
import DbService from "./dbService";
import { open, Database } from "sqlite";
import fetch from "node-fetch";
import httpSignature from "http-signature";
import { Activity, FollowerWithVisibility } from "../types";
import { signActivity } from "./utils";

function last(arr: any[]) {
  return arr[arr.length - 1];
}

class InboxService {
  dbService: DbService;

  constructor(dbService: DbService) {
    this.dbService = dbService;
  }

  public async postActivity(url: fetch.RequestInfo, activity: Activity) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/activity+json",
        },
        body: JSON.stringify(activity),
      });

      if (!response.ok) {
        console.error("Failed to send activity:", response.statusText);
      } else {
        console.log("Activity sent successfully:", response.status);
      }
    } catch (error) {
      console.error("Error sending activity:", error);
    }
  }

  public isValidUrl(url: string): boolean {
    const allowedDomains = ["example.com", "another-allowed-domain.com"];
    try {
      const parsedUrl = new URL(url);
      const isAllowedDomain = allowedDomains.includes(parsedUrl.hostname);
      const isHttps = parsedUrl.protocol === "https:";
      const isValidPath =
        !parsedUrl.pathname.includes("..") &&
        last(parsedUrl.pathname.split("/")) === "inbox";
      return isAllowedDomain && isHttps && isValidPath;
    } catch (e) {
      return false;
    }
  }

  verifyRequestSignature(req: Request): boolean {
    try {
      const parsed = httpSignature.parseRequest(req.body);
      const publicKey =
        "-----BEGIN PUBLIC KEY-----\n...your public key here...\n-----END PUBLIC KEY-----";
      return httpSignature.verifySignature(parsed, publicKey);
    } catch (e) {
      console.error("Error verifying request signature:", e);
      return false;
    }
  }

  public async postInbox(req: Request, res: Response): Promise<void> {
    if (!this.verifyRequestSignature(req)) {
      res.status(400).json({ error: "Invalid request signature" });
      return;
    }

    const username = req.params.username;
    const dbService = new DbService(
      await open({
        filename: "../activitypub.db",
        driver: Database,
      })
    );
    const actor = await dbService.getActorFromDB(username);

    if (!actor) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const activity = req.body;
    console.log("Received activity:", activity);

    if (activity.type === "Follow") {
      // Respond with an Accept activity
      const acceptActivity: Activity = {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "Accept",
        actor: actor.id,
        object: activity,
        to: [activity.actor],
      };

      if (!this.isValidUrl(activity.actor.inbox)) {
        res.status(400).json({ error: "Invalid inbox URL" });
        return;
      }

      await this.postActivity(activity.actor.inbox, acceptActivity);

      // TODO: shouldn't add to followers collection if postActivity failed?
      // Update the followers collection
      this.addFollowerToDB(username, activity.actor);
    }

    res.status(200).json({ status: "ok" });
  }

  public async notifyFollower(
    username: string,
    follower: FollowerWithVisibility,
    activity: Activity
  ) {
    if (activity.to.includes(follower.visibility)) {
      const privateKey =
        "-----BEGIN PRIVATE KEY-----\n...your private key here...\n-----END PRIVATE KEY-----";
      const keyId = "https://example.com/keys/1";
      const signedAcceptActivity = signActivity(activity, privateKey, keyId);

      try {
        const response = await fetch(follower.inbox, {
          method: "POST",
          headers: {
            "Content-Type": "application/activity+json",
          },
          body: JSON.stringify(signedAcceptActivity),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to deliver activity to ${follower.inbox}: ${response.statusText}`
          );
        }
      } catch (error: any) {
        await this.handleDeliveryFailure(
          username,
          JSON.stringify(activity),
          error.message
        );
      }
    }
  }

  public async distributeActivity(req: Request, res: Response): Promise<void> {
    const username = req.params.username;
    const activity = req.body;
    const dbService = new DbService(
      await open({
        filename: "../activitypub.db",
        driver: Database,
      })
    );

    try {
      if (activity.type == "Follow") {
        // Update the followers collection
        await this.addFollowerToDB(username, activity.actor);
      } else if (activity.type === "Like") {
        await dbService.addLikeToDB(
          activity.actor,
          activity.object,
          activity.id
        );
      } else if (activity.type === "Announce") {
        await dbService.addAnnounceToDB(
          activity.actor,
          activity.object,
          activity.id
        );
      } else if (activity.type === "Undo") {
        const targetActivity = activity.object;
        if (targetActivity.type === "Like") {
          await dbService.removeLikeFromDB(
            targetActivity.actor,
            targetActivity.object
          );
        } else if (targetActivity.type === "Announce") {
          await dbService.removeAnnounceFromDB(
            targetActivity.actor,
            targetActivity.object
          );
        }
      }

      const followers = await this.getFollowersWithVisibilityFromDB(username);
      const deliveryPromises = followers.map((f) =>
        this.notifyFollower(username, f, activity)
      );

      await Promise.all(deliveryPromises);
      res.status(200).json({ status: "ok" });
    } catch (error) {
      console.error("Error distributing activity:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  public async handleDeliveryFailure(
    username: string,
    serialisedActivity: string,
    error: string
  ): Promise<void> {
    const dbService = new DbService(
      await open({
        filename: "../activitypub.db",
        driver: Database,
      })
    );

    try {
      await dbService.logDeliveryFailure(username, serialisedActivity, error);
    } catch (logError) {
      console.error("Error logging delivery failure:", logError);
    }
  }

  addFollowerToDB(username: string, actor: any) {
    throw new Error("Function not implemented.");
  }

  getFollowersWithVisibilityFromDB(
    username: string
  ): Promise<FollowerWithVisibility[]> {
    throw new Error("Function not implemented.");
  }
}

export default InboxService;
