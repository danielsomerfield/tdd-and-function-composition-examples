import { MockedFunction } from "ts-jest";
import * as topRated from "../../src/restaurantRatings/topRated";
import { Rating } from "../../src/restaurantRatings/domain";

describe("The top rated restaurant list", () => {
  it("is calculated from our proprietary ratings algorithm", async () => {
    const ratings: RatingsForRestaurant[] = [
      {
        restaurantId: "restaurant1",
        ratings: [
          {
            ratedByUser: {
              id: "user1",
              isTrusted: true,
            },
            rating: "EXCELLENT",
          },
        ],
      },
      {
        restaurantId: "restaurant2",
        ratings: [
          {
            ratedByUser: {
              id: "user2",
              isTrusted: false,
            },
            rating: "EXCELLENT",
          },
        ],
      },
    ];

    const findRatingsByRestaurantMock: MockedFunction<
      () => Promise<RatingsForRestaurant[]>
    > = jest.fn();

    const calculateRatingsForRestaurantMock: MockedFunction<
      (ratings: RatingsForRestaurant) => number
    > = jest.fn();

    const restaurantsById = new Map<string, any>([
      ["restaurant1", { restaurantId: "restaurant1", name: "Restaurant 1" }],
      ["restaurant2", { restaurantId: "restaurant2", name: "Restaurant 2" }],
    ]);
    const getRestaurantByIdMock: MockedFunction<
      (id: string) => Promise<{ id: string; name: string }>
    > = jest.fn(id => restaurantsById.get(id));
    const dependencies = {
      getRestaurantById: getRestaurantByIdMock,
      findRatingsByRestaurant: findRatingsByRestaurantMock,
      calculateRatingForRestaurant: calculateRatingsForRestaurantMock,
    };

    findRatingsByRestaurantMock.mockResolvedValueOnce(ratings);
    calculateRatingsForRestaurantMock.mockImplementation(ratings => {
      if (ratings.restaurantId === "restaurant1") {
        return 10;
      } else if (ratings.restaurantId == "restaurant2") {
        return 5;
      } else {
        throw new Error("Unknown restaurant");
      }
    });

    const getTopRated = topRated.create(dependencies);

    const topRestaurants = await getTopRated();

    expect(topRestaurants.length).toEqual(2);

    expect(topRestaurants[0].id).toEqual("restaurant1");
    expect(topRestaurants[0].name).toEqual("Restaurant 1");
    expect(topRestaurants[1].id).toEqual("restaurant2");
    expect(topRestaurants[1].name).toEqual("Restaurant 2");
  });
});

interface RatingsForRestaurant {
  restaurantId: string;
  ratings: RestaurantRating[];
}

interface RestaurantRating {
  rating: Rating;
  ratedByUser: User;
}

interface User {
  id: string;
  isTrusted: boolean;
}

