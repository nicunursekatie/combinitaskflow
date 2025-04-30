import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const client = postgres(process.env.TASK_MANAGER_DATABASE_CONNECTION_STRING, {
  prepare: false,
  idle_timeout: 10,
  max: 3,
});
export const db = drizzle(client, { schema });