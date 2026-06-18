import { Router } from "express";
import { userRouter } from "./user.routes.ts";
import { authRouter } from "./auth.routes.ts";

export const apiRouter = Router();

apiRouter.use([authRouter, userRouter]);

export default apiRouter;
