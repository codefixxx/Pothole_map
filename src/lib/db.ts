import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : undefined,
});

const adapter = new PrismaPg(pool);

export const db =
  global.prisma ||
  new PrismaClient({
    adapter,
    log: ["query", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = db;
}
