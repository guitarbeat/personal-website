import {
  ContentError,
  validateDatasetRecords,
  validateQueryBody,
} from "../index.mjs";

describe("notion query validation", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

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

describe("validateDatasetRecords", () => {
  it("throws ContentError if records is not an array", () => {
    expect(() => {
      validateDatasetRecords("about", null);
    }).toThrow(ContentError);

    try {
      validateDatasetRecords("about", null);
    } catch (e) {
      expect(e.code).toBe("CONTENT_VALIDATION_ERROR");
      expect(e.status).toBe(502);
      expect(e.details).toEqual({ dataset: "about" });
    }
  });

  it("throws ContentError for unknown dataset type", () => {
    expect(() => {
      validateDatasetRecords("unknown", []);
    }).toThrow(ContentError);

    try {
      validateDatasetRecords("unknown", []);
    } catch (e) {
      expect(e.code).toBe("INVALID_DATABASE");
      expect(e.status).toBe(400);
      expect(e.message).toBe('Unknown dataset "unknown".');
    }
  });

  it("validates about records successfully", () => {
    const validAbout = [{ category: "test", description: "test desc" }];
    expect(validateDatasetRecords("about", validAbout)).toEqual(validAbout);
  });

  it("throws ContentError if about record is invalid", () => {
    const invalidAbout = [{ category: "", description: "test desc" }];
    expect(() => {
      validateDatasetRecords("about", invalidAbout);
    }).toThrow(ContentError);
  });

  it("validates project records successfully", () => {
    const validProject = [
      {
        title: "Title",
        slug: "slug",
        hook: "hook",
        detail: "detail",
        date: "2023",
        link: "link",
        image: "image",
        keywords: ["keyword"],
      },
    ];
    expect(validateDatasetRecords("projects", validProject)).toEqual(
      validProject,
    );
  });

  it("throws ContentError if project record is invalid", () => {
    const invalidProject = [
      {
        title: "Title",
        slug: "slug",
        hook: "hook",
        detail: "detail",
        date: "2023",
        link: "link",
        image: "image",
        keywords: [""],
      },
    ];
    expect(() => {
      validateDatasetRecords("projects", invalidProject);
    }).toThrow(ContentError);
  });

  it("validates work records successfully", () => {
    const validWork = [
      {
        title: "Title",
        slug: "slug",
        company: "Company",
        description: "Desc",
        from: "01-2023",
        to: "12-2023",
        place: "Place",
      },
    ];
    expect(validateDatasetRecords("work", validWork)).toEqual(validWork);
  });

  it("throws ContentError if work record is invalid", () => {
    const invalidWork = [
      {
        title: "Title",
        slug: "slug",
        company: "Company",
        description: "Desc",
        from: "invalid-date",
        to: "12-2023",
        place: "Place",
      },
    ];
    expect(() => {
      validateDatasetRecords("work", invalidWork);
    }).toThrow(ContentError);
  });
});
