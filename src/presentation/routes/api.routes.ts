import { Router } from "express";
import { userRouter } from "./user.routes.ts";
import { authRouter } from "./auth.routes.ts";
import { roomRouter } from "@/presentation/routes/room.routes.ts";

export const apiRouter = Router();

apiRouter.use([authRouter, userRouter]);
apiRouter.use("/rooms", roomRouter);

export default apiRouter;
