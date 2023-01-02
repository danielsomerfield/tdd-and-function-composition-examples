import { Server } from "http";
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "testcontainers";
import { createFindRatingsByRestaurant } from "../../src/restaurantRatings/ratingsRepository";
import { Pool, PoolClient } from "pg";
import * as path from "path";
import { Rating } from "../../src/restaurantRatings/domain";
import { sortByField, sortByValue } from "../testing";

describe("the ratings pository", () => {
  jest.setTimeout(1000 * 10);
  let pgContainer: StartedPostgreSqlContainer;
  let pool: Pool;

  beforeEach(async () => {
    const dbConnectionConfiguration = {
      user: "postgres",
      password: "postgres",
      host: "localhost",
      database: "restaurant_review",
    };

    const initPath = path.resolve("db");

    pgContainer = await new PostgreSqlContainer("postgres:alpine3.16")
      .withUsername(dbConnectionConfiguration.user)
      .withPassword(dbConnectionConfiguration.password)
      .withDatabase(dbConnectionConfiguration.database)
      .withBindMount(initPath, "/docker-entrypoint-initdb.d", "ro")
      .start();

    pool = new Pool({
      port: pgContainer.getPort(),
      ...dbConnectionConfiguration,
    });

    const client = await pool.connect();
    try {
      await client.query(
        "insert into \"user\" (id, name, trusted) values ('user1', 'User 1', true)",
      );
      await client.query(
        "insert into \"user\" (id, name, trusted) values ('user2', 'User 2', false)",
      );
      await client.query(
        "insert into \"user\" (id, name, trusted) values ('user3', 'User 3', false)",
      );
      await client.query(
        "insert into restaurant_rating (id, rated_by_user_id, restaurant_id, rating) VALUES ('rating1', 'user1', 'cafegloucesterid', 'EXCELLENT')",
      );
      await client.query(
        "insert into restaurant_rating (id, rated_by_user_id, restaurant_id, rating) VALUES ('rating2','user2', 'cafegloucesterid', 'TERRIBLE')",
      );
      await client.query(
        "insert into restaurant_rating (id, rated_by_user_id, restaurant_id, rating) VALUES ('rating3','user3', 'cafegloucesterid', 'AVERAGE')",
      );
      await client.query(
        "insert into restaurant_rating (id, rated_by_user_id, restaurant_id, rating) VALUES ('rating4','user3', 'redtunaid', 'ABOVE_AVERAGE')",
      );
    } finally {
      await client.release();
    }
  });

  afterEach(async () => {
    if (pool) {
      await pool.end();
    }
    if (pgContainer) {
      await pgContainer.stop();
    }
  });

  it("loads ratings by restaurant", async () => {

    const findRatingsByRestaurant = createFindRatingsByRestaurant({
      getClient: () => pool.connect(),
      releaseConnection: (client: PoolClient) => client.release(),
    });

    const ratingsByRestaurant = sortByField(
      await findRatingsByRestaurant(),
      "restaurantId",
    );

    expect(ratingsByRestaurant.length).toEqual(2);
    expect(ratingsByRestaurant[0].restaurantId).toEqual("cafegloucesterid");
    const cafeGloucesterRatings = sortByValue(
      ratingsByRestaurant[0].ratings,
      t => t.ratedByUser.id
    );

    expect(cafeGloucesterRatings.length).toEqual(3);
    expect(cafeGloucesterRatings[0]).toMatchObject({
      rating: "EXCELLENT" as Rating,
      ratedByUser: {
        id: "user1",
        isTrusted: true,
      },
    });
    expect(cafeGloucesterRatings[1]).toMatchObject({
      rating: "TERRIBLE" as Rating,
      ratedByUser: {
        id: "user2",
        isTrusted: false,
      },
    });
    expect(cafeGloucesterRatings[2]).toMatchObject({
      rating: "AVERAGE" as Rating,
      ratedByUser: {
        id: "user3",
        isTrusted: false,
      },
    });

    const redTunaRatings = sortByField(
      ratingsByRestaurant[1].ratings,
      "ratedByUser",
    );

    expect(ratingsByRestaurant[1].restaurantId).toEqual("redtunaid");
    expect(redTunaRatings.length).toEqual(1);

    expect(redTunaRatings[0]).toMatchObject({
      rating: "ABOVE_AVERAGE" as Rating,
      ratedByUser: {
        id: "user3",
        isTrusted: false,
      },
    });

    expect(pool.idleCount).toEqual(pool.totalCount);
  });
});
