import "dotenv/config";
import express from "express";
import { apiRouter, errorMiddleware } from "@/presentation";
import cookieParser from "cookie-parser";
import cors from "cors";
import { CLIENT_URL } from "@/config/api.config.ts";

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: CLIENT_URL,
  })
);
// app.use(validateMiddleware);
app.use("/api", apiRouter);
app.use(errorMiddleware);

async function main() {
  try {
    app.listen(PORT, () => console.log(`Сервер запущен на порту http://localhost:${PORT}`));
  } catch (e) {
    console.log(e);
  }
}

main();
