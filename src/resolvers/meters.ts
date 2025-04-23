import { Meter, MeterResolverArgs } from "../types";

export function metersResolver(): Meter[] {
    return [];
}

export function meterResolver(_: any, args: MeterResolverArgs): Meter | null {
    return null;
}
