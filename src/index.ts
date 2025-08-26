import "dotenv/config";
import { testConnectionToArweaveGateway } from "./utils/v1/arweave";
import { connectDB } from "./config/mongo";
import { startServer } from "./config/server";

// start server
startServer()
  .then(() => {
    connectDB().then(() => {
      console.log("Server started successfully");
    });
  })
  .catch((error) => {
    console.error("Error starting server:", error);
  });

testConnectionToArweaveGateway().then(() => {});
