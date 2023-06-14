import { Client } from "twitter-api-sdk";
import Fastify, { FastifyInstance, RouteShorthandOptions } from "fastify";

type WebhookBody = {
  post: {
    current: {
      [x: string]: unknown;
      url: string;
      title: string;
    };
    previous: {
      [x: string]: unknown;
    };
  };
};

const opts: RouteShorthandOptions = {
  schema: {
    response: {
      200: {},
    },
  },
};
const server: FastifyInstance = Fastify({});
const client = new Client(process.env.BEARER_TOKEN || "");

server.post<{ Body: WebhookBody }>("/", opts, async (request, _) => {
  const { title, url } = request.body.post.current;
  const text = `[記事を投稿しました] ${title} 
${url}`;
  console.log(text);
  await client.tweets.createTweet({ text });
  return;
});

server.listen({ port: 3000, host: "::", ipv6Only: true }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`server listening on ${address}`);
});
