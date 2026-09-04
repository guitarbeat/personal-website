export const secureRandom = (): number => {
  if (
    typeof window !== "undefined" &&
    window.crypto &&
    window.crypto.getRandomValues
  ) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] / 4294967296;
  }
  return Math.random();
};
