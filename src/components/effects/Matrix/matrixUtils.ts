export const generateMatrixCoordinate = () => {
  const sector = Math.floor(Math.random() * 64)
    .toString(16)
    .toUpperCase()
    .padStart(2, "0");
  const node = Math.floor(Math.random() * 4096)
    .toString(16)
    .toUpperCase()
    .padStart(3, "0");
  return `${sector}:${node}`;
};

export const generateSignalSeed = () => {
  return Math.floor(Math.random() * 900) + 100;
};
