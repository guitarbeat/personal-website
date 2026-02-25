import { generateId } from '../commonUtils';

describe('generateId', () => {
  it('should generate an ID with default length of 5', () => {
    const id = generateId();
    expect(id).toHaveLength(5);
  });

  it('should generate an ID with specified length', () => {
    const length = 10;
    const id = generateId(length);
    expect(id).toHaveLength(length);
  });

  it('should return empty string for length 0', () => {
    expect(generateId(0)).toBe('');
  });

  it('should return empty string for negative length', () => {
    expect(generateId(-1)).toBe('');
  });

  it('should generate IDs using the default alphabet', () => {
    const id = generateId(100);
    const defaultAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (const char of id) {
      expect(defaultAlphabet).toContain(char);
    }
  });

  it('should generate IDs using a custom alphabet', () => {
    const alphabet = 'ABC';
    const id = generateId(10, alphabet);
    for (const char of id) {
      expect(alphabet).toContain(char);
    }
  });

  it('should generate a string of length 5 consisting only of "A"', () => {
    const id = generateId(5, 'A');
    expect(id).toBe('AAAAA');
  });

  it('should return empty string for empty alphabet', () => {
    expect(generateId(5, '')).toBe('');
  });

  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});
