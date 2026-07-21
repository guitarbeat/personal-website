module.exports = function pLimit(_concurrency) {
  return function limit(fn, ...args) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
};
