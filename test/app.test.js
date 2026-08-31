import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildApp } from "../dist/app.js";

const webhookToken = "local-test-token";
const fixture = JSON.parse(
  await readFile(new URL("./fixtures/post-published.json", import.meta.url), "utf8"),
);

test("publishes a target post", async (t) => {
  const tweets = [];
  const app = buildApp({
    webhookToken,
    tweet: async (text) => tweets.push(text),
  });
  t.after(() => app.close());

  const response = await app.inject({
    method: "POST",
    url: `/webhook/${webhookToken}`,
    payload: fixture,
  });

  assert.equal(response.statusCode, 204);
  assert.deepEqual(tweets, [
    "[記事を投稿しました] test \nhttps://trap.jp/post/1595/",
  ]);
});

test("truncates long titles without splitting graphemes and preserves the URL", async (t) => {
  const tweets = [];
  const app = buildApp({
    webhookToken,
    tweet: async (text) => tweets.push(text),
  });
  t.after(() => app.close());

  const cases = [
    {
      title: "あ".repeat(101),
      expectedTitle: `${"あ".repeat(99)}…`,
    },
    {
      title: "🎉".repeat(101),
      expectedTitle: `${"🎉".repeat(99)}…`,
    },
  ];

  for (const { title, expectedTitle } of cases) {
    const response = await app.inject({
      method: "POST",
      url: `/webhook/${webhookToken}`,
      payload: {
        post: {
          current: { title, url: "https://trap.jp/post/1595/" },
        },
      },
    });
    assert.equal(response.statusCode, 204);
    assert.equal(
      tweets.at(-1),
      `[記事を投稿しました] ${expectedTitle} \nhttps://trap.jp/post/1595/`,
    );
  }
});

test("rejects an incorrect webhook token", async (t) => {
  let calls = 0;
  const app = buildApp({
    webhookToken,
    tweet: async () => {
      calls += 1;
    },
  });
  t.after(() => app.close());

  const response = await app.inject({
    method: "POST",
    url: "/webhook/wrong-token",
    payload: fixture,
  });

  assert.equal(response.statusCode, 404);
  assert.equal(calls, 0);
});

test("rejects an invalid payload", async (t) => {
  let calls = 0;
  const app = buildApp({
    webhookToken,
    tweet: async () => {
      calls += 1;
    },
  });
  t.after(() => app.close());

  const response = await app.inject({
    method: "POST",
    url: `/webhook/${webhookToken}`,
    payload: { post: { current: { title: "missing URL" } } },
  });

  assert.equal(response.statusCode, 400);
  assert.equal(calls, 0);
});

test("ignores URLs outside the target site", async (t) => {
  let calls = 0;
  const app = buildApp({
    webhookToken,
    tweet: async () => {
      calls += 1;
    },
  });
  t.after(() => app.close());

  for (const url of [
    "http://trap.jp/post/1595/",
    "https://trap.jp.example.com/post/1595/",
    "https://trap.jp/posts/1595/",
    "not-a-url",
  ]) {
    const response = await app.inject({
      method: "POST",
      url: `/webhook/${webhookToken}`,
      payload: { post: { current: { title: "test", url } } },
    });
    assert.equal(response.statusCode, 204);
  }

  assert.equal(calls, 0);
});

test("returns 502 on an API failure and keeps serving", async (t) => {
  let calls = 0;
  const app = buildApp({
    webhookToken,
    tweet: async () => {
      calls += 1;
      if (calls === 1) throw new Error("Twitter API unavailable");
    },
  });
  t.after(() => app.close());

  const firstResponse = await app.inject({
    method: "POST",
    url: `/webhook/${webhookToken}`,
    payload: fixture,
  });
  const secondResponse = await app.inject({
    method: "POST",
    url: `/webhook/${webhookToken}`,
    payload: fixture,
  });

  assert.equal(firstResponse.statusCode, 502);
  assert.equal(secondResponse.statusCode, 204);
  assert.equal(calls, 2);
});
