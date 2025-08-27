#!/bin/env node
import 'dotenv/config';
import { updateMetersState } from '../utils/v1/meters';
import { connectDB } from '../config/mongo';

connectDB().then(() => {
  updateMetersState()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
});
