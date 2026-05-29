const express = require('express');
const Pet = require('../models/Pet');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Helper function to calculate pet nutrition metrics
const calculateNutrition = (type, ageGroup, activityLevel, weight) => {
  // Resting Energy Requirement (RER)
  const baseRER = 70 * Math.pow(weight, 0.75);
  let activityMultiplier = 1.0;

  if (type === 'cat') {
    activityMultiplier = activityLevel === 'low' ? 1.0 : activityLevel === 'moderate' ? 1.2 : 1.4;
  } else {
    activityMultiplier = activityLevel === 'low' ? 1.2 : activityLevel === 'moderate' ? 1.6 : 2.0;
  }

  // Adjust for age group
  if (ageGroup === 'puppy') activityMultiplier *= 1.5;
  if (ageGroup === 'senior') activityMultiplier *= 0.8;

  const caloricTarget = Math.round(baseRER * activityMultiplier);

  // Portion distribution
  let dailyPortions = 3;
  if (weight < 8) {
    dailyPortions = 2;
  } else if (weight >= 30) {
    dailyPortions = 4;
  }

  // Recommended plan and meals
  let planName = 'Aura Essential';
  let planPrice = 999;
  let recommendedMeal = 'Aura Fit-Mix';

  if (type === 'cat') {
    recommendedMeal = 'Aura Salmon Purée';
    planName = 'Aura Essential (Feline)';
    planPrice = 999;
  } else {
    if (weight < 12) {
      planName = 'Aura Starter';
      planPrice = 1299;
      recommendedMeal = 'Aura Puppy/Small Breed Mix';
    } else if (weight >= 12 && weight < 30) {
      planName = 'Aura Vital';
      planPrice = 1999;
      recommendedMeal = 'Aura Active Turkey Blend';
    } else {
      planName = 'Aura Elite';
      planPrice = 3499;
      recommendedMeal = 'Aura Premium Beef Feast';
    }
  }

  return {
    caloricTarget,
    dailyPortions,
    recommendedMeal,
    planName,
    planPrice
  };
};

// @desc    Calculate pet calories without saving
// @route   POST /api/pets/calculate
// @access  Public
router.post('/calculate', (req, res) => {
  const { type, ageGroup, activityLevel, weight } = req.body;

  try {
    if (!type || !ageGroup || !activityLevel || !weight) {
      return res.status(400).json({
        success: false,
        error: 'Please provide type, ageGroup, activityLevel, and weight'
      });
    }

    const results = calculateNutrition(type, ageGroup, activityLevel, parseFloat(weight));
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Add a new pet profile
// @route   POST /api/pets
// @access  Private
router.post('/', protect, async (req, res) => {
  const { name, type, breed, ageGroup, activityLevel, weight } = req.body;

  try {
    if (!name || !type || !ageGroup || !activityLevel || !weight) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, type, ageGroup, activityLevel, and weight'
      });
    }

    // Run calorie calculations on server
    const metrics = calculateNutrition(type, ageGroup, activityLevel, parseFloat(weight));

    // Save to MongoDB with active User reference
    const pet = await Pet.create({
      user: req.user.id,
      name,
      type,
      breed: breed || 'Companion',
      ageGroup,
      activityLevel,
      weight: parseFloat(weight),
      ...metrics
    });

    res.status(201).json({
      success: true,
      data: pet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Get all user's pets
// @route   GET /api/pets
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const pets = await Pet.find({ user: req.user.id });
    res.status(200).json({
      success: true,
      count: pets.length,
      data: pets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Get a single pet profile
// @route   GET /api/pets/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const pet = await Pet.findById(req.route.id || req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet profile not found'
      });
    }

    // Secure check: verify if pet belongs to currently logged in user
    if (pet.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to view this pet profile'
      });
    }

    res.status(200).json({
      success: true,
      data: pet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
