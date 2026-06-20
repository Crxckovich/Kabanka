import { Router } from "express";
import { userRouter } from "./user.routes.ts";
import { authRouter } from "./auth.routes.ts";
import {roomRouter} from "@/presentation/routes/room.routes.ts";
import {guestRouter} from "@/presentation/routes/guest.routes.ts";

export const apiRouter = Router();

apiRouter.use([authRouter, userRouter]);
apiRouter.use("/guests", guestRouter);
apiRouter.use("/rooms", roomRouter);

export default apiRouter;
