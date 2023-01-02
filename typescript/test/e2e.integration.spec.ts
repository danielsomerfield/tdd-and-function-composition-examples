import axios from "axios";
import { Server } from "http";
import * as server from "../src/server";
import {
  createRatingByUserForRestaurant,
  createRestaurant,
  createUser,
} from "./domainTestingHelpers";
import * as DB from "./DB";
import { Database } from "./DB";

describe("the restaurants endpoint", () => {
  jest.setTimeout(1000 * 60);
  let app: Server | undefined;
  let database: Database | undefined;

  const user1 = { id: "u1", name: "User1", trusted: true };
  const user2 = { id: "u2", name: "User2", trusted: false };
  const user3 = { id: "u3", name: "User3", trusted: false };
  const restuarant1 = {
    id: "cafegloucesterid",
    name: "Cafe Gloucester",
  };
  const restaurant2 = {
    id: "burgerkingid",
    name: "Burger King",
  };

  beforeEach(async () => {
    database = await DB.start();
    const client = database.getClient();

    await client.connect();
    try {
      await createUser(user1, client);
      await createUser(user2, client);
      await createUser(user3, client);

      await createRestaurant(restuarant1, client);
      await createRestaurant(restaurant2, client);

      await createRatingByUserForRestaurant(
        "rating1",
        user1,
        restuarant1,
        "EXCELLENT",
        client,
      );

      await createRatingByUserForRestaurant(
        "rating2",
        user2,
        restuarant1,
        "TERRIBLE",
        client,
      );

      await createRatingByUserForRestaurant(
        "rating3",
        user3,
        restuarant1,
        "AVERAGE",
        client,
      );

      await createRatingByUserForRestaurant(
        "rating4",
        user3,
        restaurant2,
        "ABOVE_AVERAGE",
        client,
      );
    } finally {
      await client.end();
    }

    app = await server.start(() =>
      Promise.resolve({
        serverPort: 3000,
        ratingsDB: {
          ...DB.connectionConfiguration,
          port: database?.getPort(),
        },
      }),
    );
  });

  afterEach(async () => {
    await server.stop();
    await database?.stop();
  });

  it("ranks by the recommendation heuristic", async () => {
    const response = await axios.get<ResponsePayload>(
      "http://localhost:3000/restaurants/recommended",
      { timeout: 1000 },
    );
    expect(response.status).toEqual(200);
    const data = response.data;
    const returnRestaurants = data.restaurants.map(r => r.id);
    expect(returnRestaurants).toEqual(["cafegloucesterid", "burgerkingid"]);
  });
});

type ResponsePayload = {
  restaurants: { id: string; name: string }[];
};

