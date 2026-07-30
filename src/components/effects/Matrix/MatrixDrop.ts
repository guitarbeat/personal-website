import { MATRIX_RAIN } from "./constants";

const randomArray = new Uint32Array(1);

const secureRandom = (): number => {
  if (
    typeof window !== "undefined" &&
    window.crypto &&
    window.crypto.getRandomValues
  ) {
    window.crypto.getRandomValues(randomArray);
    return randomArray[0] / 4294967296;
  }
  return Math.random();
};

export class Drop {
  x: number;
  y: number;
  char: string;
  changeInterval: number;
  frame: number;
  brightness: boolean;
  trailLength: number;
  trail: { char: string; y: number }[];
  speed!: number;
  fontSize!: number;
  opacity!: number;
  brightHeadThreshold!: number;

  constructor(x: number) {
    this.x = x;
    this.y = -100;
    this.char =
      MATRIX_RAIN.ALPHABET[
        Math.floor(secureRandom() * MATRIX_RAIN.ALPHABET.length)
      ];
    this.changeInterval = secureRandom() * 50 + 15;
    this.frame = 0;
    this.brightness = secureRandom() > 0.95;
    this.trailLength = Math.floor(secureRandom() * 3) + 2;
    this.trail = [];
    this.brightHeadThreshold = 0.97;
    this.initializeCharacterProperties();
  }

  setBrightHeadThreshold(threshold: number) {
    this.brightHeadThreshold = threshold;
  }

  initializeCharacterProperties() {
    this.speed = secureRandom() * 2 + 0.8;
    this.fontSize = Math.floor(
      secureRandom() *
        (MATRIX_RAIN.FONT_SIZES.MAX - MATRIX_RAIN.FONT_SIZES.MIN) +
        MATRIX_RAIN.FONT_SIZES.MIN,
    );
    this.opacity = secureRandom() * 0.6 + 0.3;
  }

  update(canvasHeight: number, speedMultiplier = 1) {
    this.y += this.speed * speedMultiplier;
    this.frame++;

    // * Update trail
    this.trail.push({ char: this.char, y: this.y });
    if (this.trail.length > this.trailLength) {
      this.trail.shift();
    }

    if (this.frame >= this.changeInterval) {
      this.char =
        MATRIX_RAIN.ALPHABET[
          Math.floor(secureRandom() * MATRIX_RAIN.ALPHABET.length)
        ];
      this.frame = 0;
      this.brightness = secureRandom() > this.brightHeadThreshold;
    }

    if (canvasHeight && this.y * this.fontSize > canvasHeight) {
      this.y = -100 / this.fontSize;
      this.initializeCharacterProperties();
      this.trail = [];
    }
  }
}
