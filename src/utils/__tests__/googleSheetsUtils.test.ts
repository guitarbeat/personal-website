import { processAboutData, processProjectsData, processWorkData } from "../googleSheetsUtils";

describe("googleSheetsUtils", () => {
  describe("processAboutData", () => {
    it("returns empty array for empty input", () => {
      expect(processAboutData([])).toEqual([]);
    });

    it("correctly maps valid data", () => {
      const input = [
        { category: "cat1", description: "desc1" },
        { category: "cat2", description: "desc2" },
      ];
      const expected = [
        { category: "cat1", description: "desc1" },
        { category: "cat2", description: "desc2" },
      ];
      expect(processAboutData(input)).toEqual(expected);
    });

    it("ignores extraneous properties", () => {
      const input = [
        { category: "cat1", description: "desc1", extra: "ignore me" },
      ];
      const expected = [
        { category: "cat1", description: "desc1" },
      ];
      expect(processAboutData(input)).toEqual(expected);
    });
  });

  describe("processProjectsData", () => {
    it("returns empty array for empty input", () => {
      expect(processProjectsData([])).toEqual([]);
    });

    it("correctly maps valid project data", () => {
      const input = [
        {
          title: "Project 1",
          slug: "proj-1",
          date: "2023",
          keyword: "key1",
          link: "http://example.com",
          content: "content1",
          image: "img1.png",
          extra: "should be ignored"
        },
      ];
      const expected = [
        {
          title: "Project 1",
          slug: "proj-1",
          date: "2023",
          keyword: "key1",
          link: "http://example.com",
          content: "content1",
          image: "img1.png",
        },
      ];
      expect(processProjectsData(input)).toEqual(expected);
    });
  });

  describe("processWorkData", () => {
    it("returns empty array for empty input", () => {
      expect(processWorkData([])).toEqual([]);
    });

    it("correctly maps valid work data", () => {
      const input = [
        {
          title: "Role 1",
          company: "Company A",
          place: "City B",
          from: "2020",
          to: "2021",
          description: "Did stuff",
          slug: "role-1",
          extra: "ignored"
        },
      ];
      const expected = [
        {
          title: "Role 1",
          company: "Company A",
          place: "City B",
          from: "2020",
          to: "2021",
          description: "Did stuff",
          slug: "role-1",
        },
      ];
      expect(processWorkData(input)).toEqual(expected);
    });
  });
});
