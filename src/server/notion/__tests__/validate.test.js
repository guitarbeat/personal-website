import { validateQueryBody } from "../index.js";

describe("notion query validation", () => {
  it("drops invalid properties gracefully due to parsing errors", () => {
    const circularRef = {};
    circularRef.self = circularRef;

    const filter = {
      property: "title",
      title: circularRef,
      rich_text: { equals: "test" },
    };

    const validBody = validateQueryBody({ filter });
    expect(validBody.filter).toEqual({
      property: "title",
      rich_text: { equals: "test" },
    });
  });

  it("drops timestamp filters gracefully due to parsing errors", () => {
    const circularRef = {};
    circularRef.self = circularRef;

    const filter = {
      timestamp: "created_time",
      created_time: circularRef,
    };

    const validBody = validateQueryBody({ filter });
    expect(validBody.filter).toBeUndefined();
  });
});
