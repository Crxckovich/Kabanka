import { Router } from "express";
import authController from "../controllers/auth.controller.ts";
import { loginValidation, signupValidation } from "../validators/auth.validation.ts";
import { asyncMiddleware } from "../middleware/async.middleware.ts";

export const authRouter = Router();

authRouter.post("/signup", signupValidation, asyncMiddleware(authController.signup));
authRouter.post("/login", loginValidation, asyncMiddleware(authController.login));
authRouter.post("/logout", asyncMiddleware(authController.logout));
authRouter.get("/refresh", asyncMiddleware(authController.refresh));
