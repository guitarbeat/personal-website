import assert from "node:assert/strict";
import test from "node:test";
import { buildStructuredLog, sanitizeErrorMessage } from "./telemetry.mjs";

test("sanitizeErrorMessage extracts error message and strips stack trace from Error objects", () => {
  const error = new Error("Database connection failed");
  error.stack =
    "Error: Database connection failed\n    at internal/db.js:42:10";
  const result = sanitizeErrorMessage(error);

  assert.equal(result, "Database connection failed");
  assert.ok(!result.includes("stack"));
  assert.ok(!result.includes("internal/db.js"));
});

test("sanitizeErrorMessage converts non-Error inputs to string", () => {
  assert.equal(sanitizeErrorMessage("String error"), "String error");
  assert.equal(sanitizeErrorMessage(404), "404");
  assert.equal(sanitizeErrorMessage(null), "null");
  assert.equal(sanitizeErrorMessage(undefined), "undefined");
});

test("buildStructuredLog constructs JSON string with event and telemetry", () => {
  const log = buildStructuredLog("test.event", { status: "ok" });
  assert.equal(log, JSON.stringify({ event: "test.event", status: "ok" }));
});

test("sanitizeErrorMessage handles raw objects safely without exposing sensitive fields", () => {
  assert.equal(
    sanitizeErrorMessage({ message: "Raw object error", secret: "sensitive" }),
    "Raw object error",
  );
  assert.equal(
    sanitizeErrorMessage({ secret: "sensitive" }),
    "[object Object]",
  );
  assert.equal(
    sanitizeErrorMessage({ toString: () => "secret=123" }),
    "[object Object]",
  );
});
