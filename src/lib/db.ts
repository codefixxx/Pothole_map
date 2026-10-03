import "dotenv/config";
import "./env";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
}

import dns from "dns";

// DNS Fallback patch for local networks where system DNS fails to resolve *.neon.tech
if (typeof window === "undefined") {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch {}

  const origLookup = dns.lookup;
  (dns.lookup as any) = (host: any, opts: any, cb: any) => {
    const callback = typeof opts === "function" ? opts : cb;
    const options = typeof opts === "object" ? opts : {};

    if (typeof host === "string" && host.includes("neon.tech")) {
      return dns.resolve4(host, (err, addrs) => {
        if (!err && addrs && addrs.length > 0) {
          return options.all
            ? callback(null, addrs.map((a) => ({ address: a, family: 4 })))
            : callback(null, addrs[0], 4);
        }
        origLookup(host, opts, cb);
      });
    }
    origLookup(host, opts, cb);
  };
}

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  max: parseInt(process.env.DB_POOL_MAX || "20", 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  ssl: connectionString?.includes("ssl")
    ? { rejectUnauthorized: false }
    : undefined,
});

const adapter = new PrismaPg(pool);

export const db =
  global.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = db;
}

