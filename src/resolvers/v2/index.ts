import { meterDataPointResolver } from "./meterData";
import { meterResolver, metersResolver } from "./meters";

export const resolvers = {
  Query: {
    meters: metersResolver,
    meter: meterResolver,

    meterDataPoints: meterDataPointResolver,
  },
};
