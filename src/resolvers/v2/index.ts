import { meterDataPointResolver } from "./meterData";
import { meterResolver, metersResolver } from "./meters";

export const resolvers = {
  Query: {
    version: () => "2",
    meters: metersResolver,
    meter: meterResolver,

    meterDataPoints: meterDataPointResolver,
  },
};
