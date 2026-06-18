import { defineConfig } from "drizzle-kit";

const dbCredentials = {
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
};

export const dbCredentialsString = `postgres://${dbCredentials.user}:${dbCredentials.password}@${dbCredentials.host}:${dbCredentials.port}/${dbCredentials.database}`;

export default defineConfig({
  out: "./drizzle/migrations",
  schema: "**/*.schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbCredentialsString,
  },
});
