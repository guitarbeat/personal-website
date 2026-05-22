module.exports = function pLimit(_concurrency) {
  const limit = (fn, ...args) => new Promise((resolve) => resolve(fn(...args)));
  return limit;
};
