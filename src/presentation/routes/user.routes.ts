import {Router} from "express";
import userController from "../controllers/user.controller.ts";
import {asyncMiddleware} from "@/presentation/middleware/async.middleware.ts";
import {authMiddleware} from "../middleware/auth.middleware.ts";

export const userRouter = Router();

userRouter.get("/users", authMiddleware, asyncMiddleware(userController.getUsers));
userRouter.get("/activate/:link", asyncMiddleware(userController.activate));
// userRouter.get('/users/:id', userController.getOneUser);
