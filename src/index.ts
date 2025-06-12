import "dotenv/config";
import { testConnectionToArweaveGateway } from "./config/arweave";
import { connectDB } from "./config/mongo";
import { startServer } from "./config/server";
import { fetchAndStoreMeters, updateMetersState } from "./jobs/meters";

console.log("Starting application...");
// start server
startServer();
testConnectionToArweaveGateway().then(() => {
  connectDB().then(() => {
    fetchAndStoreMeters().then(() => {
      console.log("Meters fetched and stored successfully");
      // updateMetersState();
    });
  });
});
