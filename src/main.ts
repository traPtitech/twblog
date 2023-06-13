// import { Client } from "twitter-api-sdk";
import { createServer } from "http";
// const client = new Client(process.env.BEARER_TOKEN);
const server = createServer((req, _) => {
  console.log(req);
});
server.listen(3000);
