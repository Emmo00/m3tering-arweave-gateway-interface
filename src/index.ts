import "dotenv/config";
import { testConnectionToArweaveGateway } from "./utils/arweave";
import { connectDB } from "./config/mongo";
import { startServer } from "./config/server";
import { fetchAndStoreMeters, updateMetersState } from "./jobs/meters";
import { logMemoryStatistics } from "./utils/helpers";

console.log("Memory Stats:");
console.log(process.memoryUsage());
console.log("Starting application...");
// start server
startServer()
  .then(() => {
    console.log("Server started successfully");
    connectDB().then(() => {
      logMemoryStatistics();
    });
  })
  .catch((error) => {
    console.error("Error starting server:", error);
  });

testConnectionToArweaveGateway().then(() => {});
