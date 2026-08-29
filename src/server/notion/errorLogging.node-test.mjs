import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import { sanitizeErrorMessage } from "./telemetry.mjs";
import { validateQueryBody } from "./validate.mjs";

describe("Sanitized Error Logging", () => {
  let consoleErrorCalls = [];
  const originalError = console.error;

  beforeEach(() => {
    consoleErrorCalls = [];
    console.error = (...args) => {
      consoleErrorCalls.push(args);
    };
  });

  afterEach(() => {
    console.error = originalError;
  });

  it("sanitizeErrorMessage extracts message from Error instances", () => {
    const err = new Error("Test error message");
    err.stack =
      "Error: Test error message\n    at Object.<anonymous> (test.js:1:1)";
    const sanitized = sanitizeErrorMessage(err);
    assert.strictEqual(sanitized, "Test error message");
    assert.strictEqual(sanitized.includes("Stack"), false);
  });

  it("sanitizeErrorMessage converts non-Error values to string", () => {
    assert.strictEqual(sanitizeErrorMessage("string error"), "string error");
    assert.strictEqual(sanitizeErrorMessage(123), "123");
  });

  it("validateFilter logs sanitized error message when JSON parsing fails", () => {
    const cyclicObj = {};
    cyclicObj.self = cyclicObj;

    validateQueryBody({
      filter: {
        property: "test",
        title: cyclicObj,
      },
    });

    assert.strictEqual(consoleErrorCalls.length, 1);
    const [msg, errArg] = consoleErrorCalls[0];
    assert.strictEqual(msg, "Failed to parse filter property:");
    assert.strictEqual(typeof errArg, "string");
    assert.strictEqual(errArg.includes("Stack"), false);
  });
});
