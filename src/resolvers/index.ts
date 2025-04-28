import { meterDataPointResolver } from "./meterDataPoint";
import { meterResolver, metersResolver } from "./meters";

export const resolvers = {
  Query: {
    meters: metersResolver,
    meter: meterResolver,

    meterDataPoints: meterDataPointResolver,
  },
};
