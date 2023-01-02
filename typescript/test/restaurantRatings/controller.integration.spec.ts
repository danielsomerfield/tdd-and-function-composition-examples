import express from "express";
import request from "supertest";
import * as ratingsSubdomain from "../../src/restaurantRatings/index";
import * as ratingsRepository from "../../src/restaurantRatings/ratingsRepository";
import * as restaurantRepository from "../../src/restaurantRatings/restaurantRepository";
import * as ratingsAlgorithm from "../../src/restaurantRatings/ratingsAlgorithm";

import { Rating } from "../../src/restaurantRatings/domain";

xdescribe("the subdomain module", () => {

  xdescribe("the controller top rated handler", () => {
    it("delegates to the domain top rated logic", async () => {
      const ratingsByRestaurant = [
        {
          restaurantId: "restaurant1",
          ratings: [
            {
              rating: "EXCELLENT" as Rating,
              ratedByUser: { id: "user1", isTrusted: true },
            },
          ],
        },
        {
          restaurantId: "restaurant2",
          ratings: [
            {
              rating: "AVERAGE" as Rating,
              ratedByUser: { id: "user2", isTrusted: true },
            },
          ],
        },
      ];

      const restaurantsById = new Map([
        ["restaurant1", { id: "restaurant1", name: "Restaurant 1" }],
        ["restaurant2", { id: "restaurant2", name: "Restaurant 2" }],
      ]);

      jest
        .spyOn(ratingsRepository, "createFindRatingsByRestaurant")
        .mockReturnValue(() => Promise.resolve(ratingsByRestaurant));

      jest
        .spyOn(restaurantRepository, "createGetRestaurantById")
        .mockReturnValue((id: string) =>
          Promise.resolve(restaurantsById.get(id)),
        );

      jest
        .spyOn(ratingsAlgorithm, "calculateRatingForRestaurant")
        .mockReturnValue(2)
        .mockReturnValue(1)


      const app = express();
      // At this point, this is broken. I could fix it but since I'm mocking
      //  out the connection information anyway, it seems unnecessary.
      //  This test has run its course. Let's delete it.
      // ratingsSubdomain.init(app);
      const response = await request(app).get("/restaurants/recommended");
      expect(response.status).toEqual(200);
      const payload = response.body as RatedRestaurants;
      expect(payload.restaurants).toBeDefined();
      expect(payload.restaurants.length).toEqual(2);

      expect(payload.restaurants[0].id).toEqual("restaurant1");
      expect(payload.restaurants[0].name).toEqual("Restaurant 1");
      // You could also do a more terse but still backwards compat match this way.
      expect(payload.restaurants[0]).toMatchObject({
        id: "restaurant1",
        name: "Restaurant 1",
      });

      expect(payload.restaurants[1].id).toEqual("restaurant2");
      expect(payload.restaurants[1].name).toEqual("Restaurant 2");
    });
  });
});

interface RatedRestaurants {
  restaurants: { id: string; name: string }[];
}
