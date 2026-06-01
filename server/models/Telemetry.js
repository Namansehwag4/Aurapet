const mongoose = require('mongoose');

const TelemetrySchema = new mongoose.Schema({
  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true
  },
  heartRate: {
    type: Number,
    required: true
  },
  steps: {
    type: Number,
    required: true
  },
  sleepHours: {
    type: Number,
    required: true
  },
  foodCapacity: {
    type: Number, // Percentage or grams of food remaining in the hopper (e.g., 0 to 3000g)
    required: true
  },
  collarBattery: {
    type: Number, // 0 to 100%
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Telemetry', TelemetrySchema);
