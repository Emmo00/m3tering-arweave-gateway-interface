import { meterDataPointResolver } from "./meterData";
import { meterResolver, metersResolver } from "./meters";

export const resolvers = {
  Query: {
    version: () => "1",
    meters: metersResolver,
    meter: meterResolver,

    meterDataPoints: meterDataPointResolver,
  },
};
