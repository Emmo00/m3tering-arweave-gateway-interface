import fs from "fs";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import "dotenv/config";
import { meterResolver, metersResolver } from "./resolvers/meters";
import { meterDataPointResolver } from "./resolvers/meterDataPoint";

// load graphql schema from file
const typeDefs = fs.readFileSync("./schema.graphql", "utf-8");

// configure resolvers
const resolvers = {
  Query: {
    meters: metersResolver,
    meter: meterResolver,

    meterDataPoints: meterDataPointResolver,
  },
};

// The ApolloServer constructor
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// start Apollo server
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);
