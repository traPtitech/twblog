import assert from "node:assert/strict";
import test from "node:test";

import { loadConfig } from "../dist/config.js";

const validEnvironment = {
  WEBHOOK_TOKEN: "local-test-token",
  TWITTER_API_KEY: "api-key",
  TWITTER_API_SECRET: "api-secret",
  TWITTER_ACCESS_TOKEN: "access-token",
  TWITTER_ACCESS_TOKEN_SECRET: "access-secret",
};

test("loads configuration and defaults PORT to 3000", () => {
  const config = loadConfig(validEnvironment);
  assert.equal(config.port, 3000);
  assert.equal(config.webhookToken, "local-test-token");
  assert.deepEqual(config.twitter, {
    appKey: "api-key",
    appSecret: "api-secret",
    accessToken: "access-token",
    accessSecret: "access-secret",
  });
});

test("rejects missing required environment variables", () => {
  for (const name of Object.keys(validEnvironment)) {
    assert.throws(
      () => loadConfig({ ...validEnvironment, [name]: "" }),
      new RegExp(`${name} is required`),
    );
  }
});

test("rejects invalid ports", () => {
  for (const port of ["0", "65536", "3000.5", "invalid", "-1"]) {
    assert.throws(
      () => loadConfig({ ...validEnvironment, PORT: port }),
      /PORT must be an integer between 1 and 65535/,
    );
  }
});
