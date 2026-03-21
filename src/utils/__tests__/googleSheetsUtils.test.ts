import {
  processAboutData,
  processProjectsData,
  processWorkData,
} from "../googleSheetsUtils";

describe("googleSheetsUtils", () => {
  describe("processAboutData", () => {
    it("should handle empty array", () => {
      expect(processAboutData([])).toEqual([]);
    });

    it("should process valid data correctly", () => {
      const input = [
        { category: "Test Category", description: "Test Description" },
        { category: "Another", description: "Another Description" },
      ];
      expect(processAboutData(input)).toEqual([
        { category: "Test Category", description: "Test Description" },
        { category: "Another", description: "Another Description" },
      ]);
    });

    it("should ignore extra keys and handle missing keys", () => {
      const input = [
        { category: "Cat1", description: "Desc1", extra: "Ignore me" },
        { category: "Cat2" },
      ] as Record<string, string>[];

      expect(processAboutData(input)).toEqual([
        { category: "Cat1", description: "Desc1" },
        { category: "Cat2", description: undefined },
      ]);
    });
  });

  describe("processProjectsData", () => {
    it("should handle empty array", () => {
      expect(processProjectsData([])).toEqual([]);
    });

    it("should process valid data correctly", () => {
      const input = [
        {
          title: "Proj 1",
          slug: "proj-1",
          date: "2023",
          keyword: "React",
          link: "https://example.com",
          content: "Content 1",
          image: "img1.png",
        },
      ];
      expect(processProjectsData(input)).toEqual([
        {
          title: "Proj 1",
          slug: "proj-1",
          date: "2023",
          keyword: "React",
          link: "https://example.com",
          content: "Content 1",
          image: "img1.png",
        },
      ]);
    });

    it("should ignore extra keys and handle missing keys", () => {
      const input = [
        {
          title: "Proj 1",
          slug: "proj-1",
          extra: "ignore",
        },
      ] as Record<string, string>[];

      expect(processProjectsData(input)).toEqual([
        {
          title: "Proj 1",
          slug: "proj-1",
          date: undefined,
          keyword: undefined,
          link: undefined,
          content: undefined,
          image: undefined,
        },
      ]);
    });
  });

  describe("processWorkData", () => {
    it("should handle empty array", () => {
      expect(processWorkData([])).toEqual([]);
    });

    it("should process valid data correctly", () => {
      const input = [
        {
          title: "Developer",
          company: "Tech Corp",
          place: "Remote",
          from: "2020",
          to: "Present",
          description: "Did things",
          slug: "tech-corp",
        },
      ];
      expect(processWorkData(input)).toEqual([
        {
          title: "Developer",
          company: "Tech Corp",
          place: "Remote",
          from: "2020",
          to: "Present",
          description: "Did things",
          slug: "tech-corp",
        },
      ]);
    });

    it("should ignore extra keys and handle missing keys", () => {
      const input = [
        {
          title: "Developer",
          extra: "ignore",
        },
      ] as Record<string, string>[];

      expect(processWorkData(input)).toEqual([
        {
          title: "Developer",
          company: undefined,
          place: undefined,
          from: undefined,
          to: undefined,
          description: undefined,
          slug: undefined,
        },
      ]);
    });
  });
});
