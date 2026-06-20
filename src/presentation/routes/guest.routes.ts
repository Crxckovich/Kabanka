import guestController from "../controllers/guest.controller";
import { asyncMiddleware } from "../middleware/async.middleware";
import {Router} from "express";

export const guestRouter = Router();

guestRouter.post("/join", asyncMiddleware(guestController.join));
guestRouter.post("/:roomId/leave", asyncMiddleware(guestController.leave));