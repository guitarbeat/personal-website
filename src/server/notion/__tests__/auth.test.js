import { isAuthorizedCronRequest } from "../../notionContent";

describe("notion cron auth", () => {
  it("accepts only header-based cron authorization", () => {
    expect(
      isAuthorizedCronRequest(
        {
          headers: {
            authorization: "Bearer top-secret",
          },
          query: {
            secret: "top-secret",
          },
        },
        { CRON_SECRET: "top-secret" },
      ),
    ).toBe(true);

    expect(
      isAuthorizedCronRequest(
        {
          headers: {
            "x-cron-secret": "top-secret",
          },
          query: {
            secret: "top-secret",
          },
        },
        { CRON_SECRET: "top-secret" },
      ),
    ).toBe(true);

    expect(
      isAuthorizedCronRequest(
        {
          headers: {},
          query: {
            secret: "top-secret",
          },
        },
        { CRON_SECRET: "top-secret" },
      ),
    ).toBe(false);
  });
});
