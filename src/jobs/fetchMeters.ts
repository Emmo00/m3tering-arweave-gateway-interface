#!/bin/env node
import 'dotenv/config';
import { fetchAndStoreMeters } from '../utils/v1/meters';
import { connectDB } from '../config/mongo';

connectDB().then(() => {
  fetchAndStoreMeters()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
});
