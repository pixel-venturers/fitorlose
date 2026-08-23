import { definePrismaConfig } from "@prisma/cli-engine";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";
import { config } from "dotenv";

// Next.js keeps DATABASE_URL in .env.local; load it so Prisma CLI commands resolve it too.
config({ path: ".env.local" });

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./prisma/contract.prisma",
    db: {
      connection: process.env.DATABASE_URL,
    },
  }),
});
