import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "testcontainers";
import path from "path";
import { Client } from "pg";

let pgContainer: StartedPostgreSqlContainer | undefined;

export const connectionConfiguration = {
  user: "postgres",
  password: "postgres",
  host: "localhost",
  database: "restaurant_review",
};

export const start = async (): Promise<Database> => {
  const initPath = path.resolve("db");

  const failIfNotStarted = () => {
    if (!pgContainer) {
      throw "Postgres container failed to start";
    }
  };

  pgContainer = await new PostgreSqlContainer("postgres:alpine3.16")
    .withUsername(connectionConfiguration.user)
    .withPassword(connectionConfiguration.password)
    .withDatabase(connectionConfiguration.database)
    .withBindMount(initPath, "/docker-entrypoint-initdb.d", "ro")
    .start();
  return {
    getClient: () => {
      failIfNotStarted();
      return new Client({
        port: pgContainer!.getPort(),
        ...connectionConfiguration,
      });
    },
    getPort: () => {
      failIfNotStarted();
      return pgContainer!.getPort();
    },
    stop: async () => {
      return pgContainer?.stop().then();
    },
  };
};

export interface Database {
  getClient: () => Client;
  getPort: () => number;
  stop: () => Promise<void>;
}