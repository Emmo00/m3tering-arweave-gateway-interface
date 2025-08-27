import mongoose from 'mongoose';

const MeterSchema = new mongoose.Schema({
  contractId: String,
  meterNumber: String,
  state: {
    type: Object,
    default: {},
  },
});

export const MeterModel = mongoose.model('Meter', MeterSchema);
