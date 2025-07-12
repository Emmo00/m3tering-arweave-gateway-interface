import mongoose from "mongoose"

const SyncDumpSchema = new mongoose.Schema(
  {
    lastAfterCursor: {
      type: String,
      default: null,
    },
    seenContractIds: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
)

export const SyncDumpModel = mongoose.model("SyncDump", SyncDumpSchema)

export class SyncDump {
  static async getLastAfterCursor(): Promise<string | null> {
    const syncDump = await SyncDumpModel.findOne()
      .sort({ createdAt: -1 })
      .exec()
    return syncDump ? syncDump.lastAfterCursor : null
  }

  static async setLastAfterCursor(afterCursor: string): Promise<void> {
    const syncDump = await SyncDumpModel.findOne()
      .sort({ createdAt: -1 })
      .exec()
    if (syncDump) {
      syncDump.lastAfterCursor = afterCursor
      await syncDump.save()
      return
    }
    await SyncDumpModel.create({ lastAfterCursor: afterCursor })
  }

  static async getSeenContractIds(): Promise<string[]> {
    const syncDump = await SyncDumpModel.findOne()
      .sort({ createdAt: -1 })
      .exec()
    return syncDump ? syncDump.seenContractIds : []
  }

  static async addSeenContractId(contractId: string): Promise<void> {
    const syncDump = await SyncDumpModel.findOne()
      .sort({ createdAt: -1 })
      .exec()
    if (syncDump) {
      syncDump.seenContractIds.push(contractId)
      await syncDump.save()
    } else {
      await SyncDumpModel.create({ seenContractIds: [contractId] })
    }
  }

  static async reset(): Promise<void> {
    await SyncDumpModel.deleteMany({})
  }
}
