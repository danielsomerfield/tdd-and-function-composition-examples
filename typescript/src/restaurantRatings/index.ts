import { Express } from "express";
import { create } from "./topRated";
import { createTopRatedHandler } from "./contoller";
import { createFindRatingsByRestaurant } from "./ratingsRepository";
import { calculateRatingForRestaurant } from "./ratingsAlgorithm";
import { createGetRestaurantById } from "./restaurantRepository";
import { Pool, PoolClient } from "pg";

interface Configuration {
  db: {
    user: string;
    password: string;
    host: string;
    database: string;
  };
}

let pool: Pool;

export const init = (express: Express, configuration: Configuration) => {
  pool = new Pool(configuration.db);

  pool.on("error", (err, client) => {
    console.error("Error from connection pool: " + err);
  });

  const dbDependencies = {
    getClient: () => pool.connect(),
    releaseConnection: (client: PoolClient) => {
      client.release();
    },
  };

  const findRatingsByRestaurant = createFindRatingsByRestaurant(dbDependencies);
  const getRestaurantById = createGetRestaurantById(dbDependencies);

  const topRatedHandlerDependencies = {
    findRatingsByRestaurant,
    calculateRatingForRestaurant,
    getRestaurantById,
  };
  const topRated = create(topRatedHandlerDependencies);

  const topRatedHandler = createTopRatedHandler({
    getTopRestaurants: topRated,
  });

  express.get("/restaurants/recommended", topRatedHandler);
};

export const shutdown = async () => {
  if (pool) {
    await pool.end();
  }
};
