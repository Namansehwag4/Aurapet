const Telemetry = require('../models/Telemetry');

// Generates 7 days of historical logs for a new pet profile
const generateHistoricalData = async (petId, petType) => {
  const history = [];
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  // Base configurations depending on species
  const baseHR = petType === 'cat' ? 130 : 90;
  const baseSteps = petType === 'cat' ? 3500 : 9000;
  const baseSleep = petType === 'cat' ? 14 : 11;

  for (let i = 7; i >= 1; i--) {
    const dayTimestamp = new Date(now - i * oneDay);
    
    // Add random fluctuations to make data look authentic
    const hrFluctuation = Math.floor(Math.random() * 15) - 7; // -7 to +7
    const stepFluctuation = Math.floor(Math.random() * 2000) - 1000; // -1000 to +1000
    const sleepFluctuation = (Math.random() * 3) - 1.5; // -1.5 to +1.5

    const steps = Math.max(1000, baseSteps + stepFluctuation);
    const heartRate = baseHR + hrFluctuation;
    const sleepHours = Math.round((baseSleep + sleepFluctuation) * 10) / 10;
    
    // Food starts full (3000g) and drops by ~300g per day
    const foodCapacity = Math.max(200, 3000 - (7 - i) * 300 - Math.floor(Math.random() * 100));
    // Battery drops by ~5% per day from 100%
    const collarBattery = Math.max(5, 100 - (7 - i) * 5);

    history.push({
      pet: petId,
      heartRate,
      steps,
      sleepHours,
      foodCapacity,
      collarBattery,
      timestamp: dayTimestamp
    });
  }

  // Write all historical documents to MongoDB
  await Telemetry.insertMany(history);
  console.log(`Generated 7-day health history log for Pet: ${petId}`);
};

// Lazy-simulation updater: returns current vitals, adding new simulated logs if time has elapsed
const getLiveTelemetry = async (petId, petType) => {
  const now = new Date();
  
  // Find the latest telemetry entry for this pet
  let latest = await Telemetry.findOne({ pet: petId }).sort({ timestamp: -1 });

  // If no telemetry exists, generate history first
  if (!latest) {
    await generateHistoricalData(petId, petType);
    latest = await Telemetry.findOne({ pet: petId }).sort({ timestamp: -1 });
  }

  const timeDiffMs = now - latest.timestamp;
  const fiveMinutes = 5 * 60 * 1000;

  // If the last entry is older than 5 minutes, generate a new live snapshot
  if (timeDiffMs > fiveMinutes) {
    const baseHR = petType === 'cat' ? 130 : 90;
    const hrFluctuation = Math.floor(Math.random() * 20) - 10; // -10 to +10

    // Fluctuate stats
    const heartRate = baseHR + hrFluctuation;
    // Add dynamic steps based on duration
    const minutesPassed = Math.floor(timeDiffMs / (60 * 1000));
    const stepsAdded = Math.floor(minutesPassed * (petType === 'cat' ? 3 : 8) * (Math.random() + 0.2));
    const steps = latest.steps + stepsAdded;
    
    // Battery drops by 0.1% per hour
    const batteryLoss = (minutesPassed / 60) * 0.1;
    const collarBattery = Math.max(5, Math.round((latest.collarBattery - batteryLoss) * 10) / 10);
    
    // Slowly drain food tank (e.g. 5g per hour)
    const foodLoss = (minutesPassed / 60) * 5;
    const foodCapacity = Math.max(50, Math.round(latest.foodCapacity - foodLoss));

    // Save new log
    const newVitals = await Telemetry.create({
      pet: petId,
      heartRate,
      steps,
      sleepHours: latest.sleepHours, // Update sleep only daily in real application
      foodCapacity,
      collarBattery,
      timestamp: now
    });

    return newVitals;
  }

  return latest;
};

module.exports = {
  generateHistoricalData,
  getLiveTelemetry
};
