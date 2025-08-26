import fs from "fs";
import http from "http";
import cors from "cors";
import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { resolvers as v1Resolvers } from "../resolvers/v1/index";
import { resolvers as v2Resolvers } from "../resolvers/v2/index";

// load graphql schema from file
const typeDefsV1 = fs.readFileSync("./schema.graphql", "utf-8");
const typeDefsV2 = fs.readFileSync("./schema.v2.graphql", "utf-8");

const app = express();
const httpServer = http.createServer(app);

// The ApolloServer constructor
const server = new ApolloServer({
  typeDefs: typeDefsV1,
  resolvers: v1Resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

const serverV1 = new ApolloServer({
  typeDefs: typeDefsV1,
  resolvers: v1Resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

const serverV2 = new ApolloServer({
  typeDefs: typeDefsV2,
  resolvers: v2Resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

export async function startServer() {
  await server.start();
  await serverV1.start();
  await serverV2.start();

  // configure versioned endpoints
  app.use(cors());
  app.use("/graphql", express.json(), expressMiddleware(server)); // maintain V1 as default for "/graphql"
  app.use("/v1/graphql", express.json(), expressMiddleware(serverV1));
  app.use("/v2/graphql", express.json(), expressMiddleware(serverV2));

  return await new Promise<void>((resolve) => {
    const PORT = process.env.PORT || 4000;
    httpServer.listen({ port: PORT }, () => {
      console.log("Subgraph server started on port", PORT);
      resolve();
    });
  });
}
