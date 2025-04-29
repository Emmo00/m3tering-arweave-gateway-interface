import fs from "fs";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { resolvers } from "../resolvers/index";

// load graphql schema from file
const typeDefs = fs.readFileSync("./schema.graphql", "utf-8");

// The ApolloServer constructor
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

export const startServer = async () => {
  startStandaloneServer(server, {
    listen: { port: 4001 },
  })
    .then(({ url }) => {
      // eslint-disable-next-line no-console
      console.log(`🚀  Server ready at: ${url}`);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error("Error starting server:", error);
      process.exit(1);
    });
};
