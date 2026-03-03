import {
  processAboutData,
  processProjectsData,
  processWorkData,
} from '../googleSheetsUtils';

describe('googleSheetsUtils', () => {
  describe('processAboutData', () => {
    it('should correctly map raw data to AboutItem array', () => {
      const input = [
        { category: 'Skills', description: 'React, Node.js', extra: 'ignored' },
        { category: 'Experience', description: '5 years' },
      ];
      const expected = [
        { category: 'Skills', description: 'React, Node.js' },
        { category: 'Experience', description: '5 years' },
      ];
      expect(processAboutData(input)).toEqual(expected);
    });

    it('should return an empty array for empty input', () => {
      expect(processAboutData([])).toEqual([]);
    });
  });

  describe('processProjectsData', () => {
    it('should correctly map raw data to ProjectItem array', () => {
      const input = [
        {
          title: 'Project 1',
          slug: 'project-1',
          date: '2023',
          keyword: 'react',
          link: 'https://example.com',
          content: 'Content 1',
          image: 'image1.png',
          extra: 'ignored',
        },
      ];
      const expected = [
        {
          title: 'Project 1',
          slug: 'project-1',
          date: '2023',
          keyword: 'react',
          link: 'https://example.com',
          content: 'Content 1',
          image: 'image1.png',
        },
      ];
      expect(processProjectsData(input)).toEqual(expected);
    });

    it('should return an empty array for empty input', () => {
      expect(processProjectsData([])).toEqual([]);
    });
  });

  describe('processWorkData', () => {
    it('should correctly map raw data to WorkItem array', () => {
      const input = [
        {
          title: 'Engineer',
          company: 'Tech Co',
          place: 'Remote',
          from: '2020',
          to: 'Present',
          description: 'Did things',
          slug: 'tech-co',
          extra: 'ignored',
        },
      ];
      const expected = [
        {
          title: 'Engineer',
          company: 'Tech Co',
          place: 'Remote',
          from: '2020',
          to: 'Present',
          description: 'Did things',
          slug: 'tech-co',
        },
      ];
      expect(processWorkData(input)).toEqual(expected);
    });

    it('should return an empty array for empty input', () => {
      expect(processWorkData([])).toEqual([]);
    });
  });
});
