import postgres from "@prisma/orm-postgres/runtime";

import contractJson from "./contract.json" with { type: "json" };

export const db = postgres({ contractJson, url: process.env.DATABASE_URL });

let connection;

export function connectDatabase() {
  connection ??= db
    .connect()
    .then(() => undefined)
    .catch((error) => {
      connection = undefined;
      throw error;
    });
  return connection;
}
