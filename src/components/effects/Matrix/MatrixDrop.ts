import { MATRIX_RAIN } from "./constants";

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

  constructor(x: number) {
    this.x = x;
    this.y = -100;
    this.char =
      MATRIX_RAIN.ALPHABET[
        Math.floor(Math.random() * MATRIX_RAIN.ALPHABET.length)
      ];
    this.changeInterval = Math.random() * 50 + 15;
    this.frame = 0;
    this.brightness = Math.random() > 0.95;
    this.trailLength = Math.floor(Math.random() * 3) + 2;
    this.trail = [];
    this.initializeCharacterProperties();
  }

  initializeCharacterProperties() {
    this.speed = Math.random() * 2 + 0.8;
    this.fontSize = Math.floor(
      Math.random() *
        (MATRIX_RAIN.FONT_SIZES.MAX - MATRIX_RAIN.FONT_SIZES.MIN) +
        MATRIX_RAIN.FONT_SIZES.MIN,
    );
    this.opacity = Math.random() * 0.6 + 0.3;
  }

  update(canvasHeight: number) {
    this.y += this.speed;
    this.frame++;

    // * Update trail
    this.trail.push({ char: this.char, y: this.y });
    if (this.trail.length > this.trailLength) {
      this.trail.shift();
    }

    if (this.frame >= this.changeInterval) {
      this.char =
        MATRIX_RAIN.ALPHABET[
          Math.floor(Math.random() * MATRIX_RAIN.ALPHABET.length)
        ];
      this.frame = 0;
      this.brightness = Math.random() > 0.97;
    }

    if (canvasHeight && this.y * this.fontSize > canvasHeight) {
      this.y = -100 / this.fontSize;
      this.initializeCharacterProperties();
      this.trail = [];
    }
  }
}
