import { db } from "@/infrastructure";
import { eq } from "drizzle-orm";
import { tokenSchema } from "@/infrastructure/database/schemas/token/token.schema.ts";

export class TokenRepository {
  async addToken(data: typeof tokenSchema.$inferInsert) {
    return db.insert(tokenSchema).values(data);
  }

  async upsertToken(userId: number, refreshToken: string) {
    return db.insert(tokenSchema).values({ userId, refreshToken }).onConflictDoUpdate({
      target: tokenSchema.userId,
      set: { refreshToken },
    });
  }

  async getTokenById(userId: number) {
    return db.query.tokenSchema.findFirst({
      where: eq(tokenSchema.userId, userId),
    });
  }

  async getTokenByRef(refreshToken: string) {
    return db.query.tokenSchema.findFirst({
      where: eq(tokenSchema.refreshToken, refreshToken),
    });
  }

  async removeToken(refreshToken: string) {
    return db.delete(tokenSchema).where(eq(tokenSchema.refreshToken, refreshToken));
  }
}

export const tokenRepository = new TokenRepository();
