export type Config = {
  port: number;
  webhookToken: string;
  twitter: {
    appKey: string;
    appSecret: string;
    accessToken: string;
    accessSecret: string;
  };
};

type Environment = Readonly<Record<string, string | undefined>>;

const required = (environment: Environment, name: string): string => {
  const value = environment[name];
  if (value === undefined || value.length === 0) {
    throw new Error(`${name} is required`);
  }
  return value;
};

const readPort = (value: string | undefined): number => {
  if (value === undefined) return 3000;
  if (!/^\d+$/.test(value)) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
  const port = Number(value);
  if (port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
  return port;
};

export const loadConfig = (environment: Environment = process.env): Config => ({
  port: readPort(environment.PORT),
  webhookToken: required(environment, "WEBHOOK_TOKEN"),
  twitter: {
    appKey: required(environment, "TWITTER_API_KEY"),
    appSecret: required(environment, "TWITTER_API_SECRET"),
    accessToken: required(environment, "TWITTER_ACCESS_TOKEN"),
    accessSecret: required(environment, "TWITTER_ACCESS_TOKEN_SECRET"),
  },
});
