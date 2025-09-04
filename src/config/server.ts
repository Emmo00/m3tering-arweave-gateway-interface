import fs from 'fs';
import http from 'http';
import cors from 'cors';
import express from 'express';
import logger from 'morgan';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { resolvers as v1Resolvers } from '../resolvers/v1/index';
import { resolvers as v2Resolvers } from '../resolvers/v2/index';

// load graphql schema from file
const typeDefsV1 = fs.readFileSync('./schema.graphql', 'utf-8');
const typeDefsV2 = fs.readFileSync('./schema.v2.graphql', 'utf-8');

const app = express();
const httpServer = http.createServer(app);

// The ApolloServer constructor
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
  await serverV1.start();
  await serverV2.start();

  // configure versioned endpoints
  app.use(cors());
  app.use(logger('dev'));
  app.use('/graphql', express.json(), expressMiddleware(serverV1)); // maintain V1 as default for "/graphql"
  app.use('/v1/graphql', express.json(), expressMiddleware(serverV1));
  app.use('/v1', express.json(), expressMiddleware(serverV1));
  app.use('/v2/graphql', express.json(), expressMiddleware(serverV2));
  app.use('/v2', express.json(), expressMiddleware(serverV2));
  app.use('/', express.json(), expressMiddleware(serverV1)); // maintain V1 as default for "/"

  return await new Promise<void>((resolve) => {
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
    const hostname = process.env.HOSTNAME || '0.0.0.0';
    httpServer.listen(PORT, hostname, () => {
      console.log('Subgraph server started on port', PORT);
      resolve();
    });
  });
}
