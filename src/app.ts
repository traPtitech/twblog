import Fastify, { LogController, type FastifyInstance } from "fastify";

export type Tweet = (text: string) => Promise<void>;

type WebhookBody = {
  post: {
    current: {
      title: string;
      url: string;
    };
  };
};

type WebhookParams = {
  token: string;
};

export type AppOptions = {
  webhookToken: string;
  tweet: Tweet;
  logger?: boolean;
};

const webhookSchema = {
  params: {
    type: "object",
    required: ["token"],
    properties: { token: { type: "string" } },
  },
  body: {
    type: "object",
    required: ["post"],
    properties: {
      post: {
        type: "object",
        required: ["current"],
        properties: {
          current: {
            type: "object",
            required: ["title", "url"],
            properties: {
              title: { type: "string" },
              url: { type: "string" },
            },
          },
        },
      },
    },
  },
} as const;

const isTargetPost = (rawUrl: string): boolean => {
  try {
    const url = new URL(rawUrl);
    return (
      url.protocol === "https:" &&
      url.hostname === "trap.jp" &&
      url.pathname.startsWith("/post/")
    );
  } catch {
    return false;
  }
};

export const buildApp = (options: AppOptions): FastifyInstance => {
  if (options.webhookToken.length === 0) {
    throw new Error("webhookToken must not be empty");
  }

  const app = Fastify({
    logger: options.logger ?? false,
    logController: new LogController({ disableRequestLogging: true }),
  });

  app.post<{ Params: WebhookParams; Body: WebhookBody }>(
    "/webhook/:token",
    { schema: webhookSchema },
    async (request, reply) => {
      if (request.params.token !== options.webhookToken) {
        return reply.code(404).send();
      }

      const { title, url } = request.body.post.current;
      if (!isTargetPost(url)) {
        return reply.code(204).send();
      }

      const text = `[記事を投稿しました] ${title} \n${url}`;
      try {
        await options.tweet(text);
      } catch (error) {
        request.log.error({ err: error }, "failed to publish tweet");
        return reply.code(502).send();
      }

      request.log.info("tweet published");
      return reply.code(204).send();
    },
  );

  return app;
};
