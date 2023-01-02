import { Handler, Request, Response } from "express";
import { MockedFunction } from "ts-jest";
import * as controller from "../../src/restaurantRatings/contoller";
import fn = jest.fn;
import { StatusCode } from "../../src/statusCode";
import { quietLogs } from "../testing";

describe("the top rated controller", () => {
  const dependenciesMock = {
    getTopRestaurants: jest.fn(),
  };

  const request: Request = {} as Request;
  const statusMock: MockedFunction<(code: number) => Response> = fn();
  const contentTypeMock: MockedFunction<(contentType: string) => Response> = fn();
  const response: Response = {
    status: statusMock,
    send: fn(),
    contentType: contentTypeMock,
  } as unknown as Response;

  const handler: Handler =
    controller.createTopRatedHandler(dependenciesMock);

  beforeEach(() => {
    jest.resetAllMocks();
    statusMock.mockReturnValue(response);
    contentTypeMock.mockReturnValue(response)
  });

  it("returns top rated restaurants as JSON", async () => {
    const topRestaurants = [
      {
        id: "cafegloucesterid",
        name: "Cafe Gloucester",
      },
      {
        id: "baravignonid",
        name: "Bar Avignon",
      },
    ];
    dependenciesMock.getTopRestaurants.mockResolvedValue(topRestaurants);

    await handler(request, response, () => {});

    expect(response.status).toBeCalledWith(200);
    expect(response.contentType).toBeCalledWith("application/json");
    expect(response.send).toBeCalledWith({
      restaurants: topRestaurants,
    });
  });

  it("returns a 500 when there is an unexpected error with an error payload", async () => {
    quietLogs();

    const handler: Handler =
      controller.createTopRatedHandler(dependenciesMock);
    dependenciesMock.getTopRestaurants.mockRejectedValue(new Error());

    await handler(request, response, () => {});

    expect(response.status).toBeCalledWith(500);
    expect(response.contentType).toBeCalledWith("application/json");
    expect(response.send).toBeCalledWith(
      expect.objectContaining({
        statusCode: StatusCode.UNEXPECTED,
        message: expect.any(String),
      }),
    );
  });
});
