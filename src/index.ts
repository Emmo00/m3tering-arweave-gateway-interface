import "dotenv/config"
import { testConnectionToArweaveGateway } from "./utils/arweave"
import { connectDB } from "./config/mongo"
import { startServer } from "./config/server"
import { fetchAndStoreMeters, updateMetersState } from "./jobs/meters"
import { logMemoryStatistics } from "./utils/helpers"

console.log("Memory Stats:")
console.log(process.memoryUsage())
console.log("Starting application...")
// start server
startServer()
testConnectionToArweaveGateway().then(() => {
  connectDB().then(() => {
    logMemoryStatistics()
    fetchAndStoreMeters().then(() => {
      console.log("Meters fetched and stored successfully")
      // updateMetersState();
    })
  })
})
