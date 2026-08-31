import { TwitterApi } from "twitter-api-v2";
import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const client = new TwitterApi(config.twitter);
const app = buildApp({
  webhookToken: config.webhookToken,
  logger: true,
  tweet: async (text) => {
    await client.v2.tweet(text);
  },
});

try {
  await app.listen({ port: config.port, host: "::" });
} catch (error) {
  app.log.error({ err: error }, "failed to start server");
  process.exitCode = 1;
}
