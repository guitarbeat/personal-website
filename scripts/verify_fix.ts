import { throttle } from "../src/utils/commonUtils.ts";

let count = 0;
const throttledFn = throttle(() => {
  count++;
}, 100);

throttledFn();
throttledFn();
throttledFn();

if (count !== 1) {
  console.error("Throttle failed. Expected count 1, got", count);
  process.exit(1);
}

setTimeout(() => {
  throttledFn();
  if (count !== 2) {
    console.error("Throttle failed after wait. Expected count 2, got", count);
    process.exit(1);
  }
  console.log("Throttle success!");
  process.exit(0);
}, 150);
