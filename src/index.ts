import "dotenv/config";
import { testConnectionToArweaveGateway } from "./config/arweave";
import { connectDB } from "./config/mongo";
import { startServer } from "./config/server";
import { fetchAndStoreMeters } from "./jobs/meters";

// start server
startServer();
testConnectionToArweaveGateway().then(() => {
  connectDB().then(() => {
    fetchAndStoreMeters();
    // startServer().then(() => {
    //   console.log("Server started successfully");
    // });
  });
});
