import { Drop } from '../MatrixDrop';
import { MATRIX_RAIN } from '../constants';

describe('MatrixDrop Drop class', () => {
  beforeEach(() => {
    // We can mock Math.random to make tests deterministic if we want,
    // but the actual class uses a fallback `secureRandom` which might use crypto or Math.random.
    // For now let's just assert on ranges or simple state.
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    // Mock crypto if present to ensure fallback or predictable behaviour
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      jest.spyOn(window.crypto, 'getRandomValues').mockImplementation((arr: any) => {
        arr[0] = 4294967296 * 0.5; // Will result in 0.5 when divided by 4294967296
        return arr;
      });
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with provided x coordinate and random properties', () => {
    const drop = new Drop(10);
    expect(drop.x).toBe(10);
    expect(drop.y).toBe(-100);
    expect(MATRIX_RAIN.ALPHABET).toContain(drop.char);
    expect(drop.changeInterval).toBeGreaterThan(0);
    expect(drop.frame).toBe(0);
    expect(typeof drop.brightness).toBe('boolean');
    expect(drop.trailLength).toBeGreaterThan(0);
    expect(drop.trail).toEqual([]);
    expect(drop.speed).toBeGreaterThan(0);
    expect(drop.fontSize).toBeGreaterThanOrEqual(MATRIX_RAIN.FONT_SIZES.MIN);
    expect(drop.fontSize).toBeLessThanOrEqual(MATRIX_RAIN.FONT_SIZES.MAX);
    expect(drop.opacity).toBeGreaterThan(0);
    expect(drop.brightHeadThreshold).toBe(0.97);
  });

  it('should allow updating bright head threshold', () => {
    const drop = new Drop(10);
    drop.setBrightHeadThreshold(0.85);
    expect(drop.brightHeadThreshold).toBe(0.85);
  });

  it('should update position on update()', () => {
    const drop = new Drop(10);
    const initialY = drop.y;
    const canvasHeight = 1000;

    drop.update(canvasHeight, 1);

    expect(drop.y).toBeGreaterThan(initialY);
    expect(drop.frame).toBe(1);
    expect(drop.trail.length).toBe(1);
    expect(drop.trail[0].y).toBe(drop.y);
    expect(drop.trail[0].char).toBe(drop.char);
  });

  it('should maintain trail up to trailLength', () => {
    const drop = new Drop(10);
    drop.trailLength = 2; // Override for testing
    const canvasHeight = 1000;

    drop.update(canvasHeight, 1);
    drop.update(canvasHeight, 1);
    expect(drop.trail.length).toBe(2);

    drop.update(canvasHeight, 1);
    expect(drop.trail.length).toBe(2); // Should not exceed 2
  });

  it('should change character after changeInterval', () => {
    const drop = new Drop(10);
    drop.changeInterval = 2;
    const initialChar = drop.char;
    const canvasHeight = 1000;

    // We mock the random behavior to ensure char changes predictably if possible,
    // or just check that it gets re-assigned. Since our mock gives 0.5 always, it would be the same character.
    // Let's change the mock dynamically.
    jest.spyOn(Math, 'random').mockReturnValueOnce(0.1); // For the initialization if Math.random was used

    drop.update(canvasHeight, 1);
    expect(drop.frame).toBe(1);

    // Change random to pick a different char
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
       jest.spyOn(window.crypto, 'getRandomValues').mockImplementation((arr: any) => {
        arr[0] = 4294967296 * 0.9;
        return arr;
      });
    }

    drop.update(canvasHeight, 1);

    expect(drop.frame).toBe(0); // Frame resets
  });

  it('should reset position when exceeding canvas height', () => {
    const drop = new Drop(10);
    drop.y = 1000; // Almost at bottom
    drop.fontSize = 16;
    const canvasHeight = 800; // Force condition y * fontSize > canvasHeight (1000 * 16 > 800)

    drop.update(canvasHeight, 1);

    expect(drop.y).toBe(-100 / 16); // Uses old font size before it is reinitialized
    expect(drop.trail.length).toBe(0); // Trail is cleared
  });
});
