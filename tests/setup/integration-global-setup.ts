import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync } from "child_process";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";

let container: StartedPostgreSqlContainer;

export async function setup() {
  console.log("[integration-setup] Starting PostgreSQL test container...");
  container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("ferhatacademy_test")
    .withUsername("test")
    .withPassword("test")
    .start();

  const url = container.getConnectionUri();
  process.env.DATABASE_URL = url;
  // Expose to child processes
  process.env.TEST_DATABASE_URL = url;

  console.log("[integration-setup] Running prisma migrate deploy...");
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "inherit",
  });
  console.log("[integration-setup] Migrations applied. Container ready.");
}

export async function teardown() {
  if (container) {
    console.log("[integration-setup] Stopping test container...");
    await container.stop();
  }
}
