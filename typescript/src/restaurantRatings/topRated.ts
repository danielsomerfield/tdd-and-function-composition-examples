import { Rating } from "./domain";

interface RatingsByRestaurant {
  restaurantId: string;
  ratings: RestaurantRating[];
}

interface OverallRating {
  restaurantId: string;
  rating: number;
}

interface RestaurantRating {
  rating: Rating;
  ratedByUser: User;
}

interface User {
  id: string;
  isTrusted: boolean;
}

interface Dependencies {
  getRestaurantById: (id: string) => Promise<Restaurant | undefined>;
  findRatingsByRestaurant: () => Promise<RatingsByRestaurant[]>;
  calculateRatingForRestaurant: (ratings: RatingsByRestaurant) => number;
}

interface Restaurant {
  id: string;
  name: string;
}

const sortByOverallRating = (overallRatings: OverallRating[]) =>
  overallRatings.sort((a, b) => b.rating - a.rating);

const calculateRatings = (
  ratingsByRestaurant: RatingsByRestaurant[],
  calculateRatingForRestaurant: (ratings: RatingsByRestaurant) => number,
): OverallRating[] =>
  ratingsByRestaurant.map(ratings => {
    return {
      restaurantId: ratings.restaurantId,
      rating: calculateRatingForRestaurant(ratings),
    };
  });

export const create = (dependencies: Dependencies) => {
  const getTopRestaurants = async (): Promise<Restaurant[]> => {
    const {
      findRatingsByRestaurant,
      calculateRatingForRestaurant,
      getRestaurantById,
    } = dependencies;

    const toRestaurant = async (r: OverallRating) => {
      const restaurant = await getRestaurantById(r.restaurantId);
      if (restaurant) {
        return {
          id: r.restaurantId,
          name: restaurant.name,
        };
      } else {
        return null;
      }
    };

    const ratingsByRestaurant = await findRatingsByRestaurant();

    const overallRatings = calculateRatings(
      ratingsByRestaurant,
      calculateRatingForRestaurant,
    );

    const sorted = sortByOverallRating(overallRatings);
    return Promise.all(
      sorted.map(r => {
        return toRestaurant(r);
      }),
    ).then(maybeRestaurants => {
      // We need the cast here because the filter function,
      // can't tell we're filtering out nulls. That's still
      // better than forcing our consumer to filter nulls we know
      // won't be there.
      return maybeRestaurants.filter(r => r) as Restaurant[];
    });
  };

  return getTopRestaurants;
};
