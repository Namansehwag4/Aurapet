const express = require('express');
const Telemetry = require('../models/Telemetry');
const Pet = require('../models/Pet');
const { protect } = require('../middleware/auth');
const { getLiveTelemetry } = require('../services/simulator');

const router = express.Router();

// Helper to get pet details and verify ownership
const verifyPetOwnership = async (petId, userId, res) => {
  const pet = await Pet.findById(petId);
  if (!pet) {
    res.status(404).json({ success: false, error: 'Pet profile not found' });
    return null;
  }
  if (pet.user.toString() !== userId) {
    res.status(401).json({ success: false, error: 'Not authorized to access this pet profile' });
    return null;
  }
  return pet;
};

// @desc    Get latest real-time vitals snapshot
// @route   GET /api/telemetry/:petId/latest
// @access  Private
router.get('/:petId/latest', protect, async (req, res) => {
  try {
    const petId = req.params.petId;
    const pet = await verifyPetOwnership(petId, req.user.id, res);
    if (!pet) return;

    // Get or update telemetry via simulator
    const vitals = await getLiveTelemetry(petId, pet.type);
    
    res.status(200).json({
      success: true,
      data: vitals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Get historical vitals logs for Chart.js (last 7 entries)
// @route   GET /api/telemetry/:petId/history
// @access  Private
router.get('/:petId/history', protect, async (req, res) => {
  try {
    const petId = req.params.petId;
    const pet = await verifyPetOwnership(petId, req.user.id, res);
    if (!pet) return;

    // Retrieve last 7 records sorted ascending by timestamp (so charts render left-to-right)
    const logs = await Telemetry.find({ pet: petId })
      .sort({ timestamp: -1 })
      .limit(7);

    res.status(200).json({
      success: true,
      data: logs.reverse() // Reverse back to chronological order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Simulate food dispense event
// @route   POST /api/telemetry/:petId/dispense
// @access  Private
router.post('/:petId/dispense', protect, async (req, res) => {
  try {
    const petId = req.params.petId;
    const pet = await verifyPetOwnership(petId, req.user.id, res);
    if (!pet) return;

    // Find the latest telemetry entry
    let latest = await Telemetry.findOne({ pet: petId }).sort({ timestamp: -1 });
    if (!latest) {
      latest = await getLiveTelemetry(petId, pet.type);
    }

    const dispenseAmount = 100; // Dispense 100g of kibble
    const newFoodCapacity = Math.max(0, latest.foodCapacity - dispenseAmount);

    // Create a new telemetry record recording the action
    const updateLog = await Telemetry.create({
      pet: petId,
      heartRate: latest.heartRate + 5, // Heart rate rises slightly due to excitement!
      steps: latest.steps,
      sleepHours: latest.sleepHours,
      foodCapacity: newFoodCapacity,
      collarBattery: latest.collarBattery,
      timestamp: new Date()
    });

    console.log(`Smart Dispenser triggered: served ${dispenseAmount}g for pet ${petId}. Remaining capacity: ${newFoodCapacity}g.`);

    res.status(200).json({
      success: true,
      message: `Successfully dispensed ${dispenseAmount}g of custom kibble.`,
      data: updateLog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
