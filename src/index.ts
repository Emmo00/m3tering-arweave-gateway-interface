import "dotenv/config";
import { testConnectionToArweaveGateway } from "./utils/arweave";
import { connectDB } from "./config/mongo";
import { startServer } from "./config/server";
import { fetchAndStoreMeters, updateMetersState } from "./utils/meters";

// start server
startServer()
  .then(() => {
    console.log("Server started successfully");
    connectDB().then(() => {});
  })
  .catch((error) => {
    console.error("Error starting server:", error);
  });

testConnectionToArweaveGateway().then(() => {});
