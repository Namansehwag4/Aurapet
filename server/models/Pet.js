const mongoose = require('mongoose');

const PetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a name for your pet']
  },
  type: {
    type: String,
    required: [true, 'Please specify if your pet is a dog or cat'],
    enum: ['dog', 'cat']
  },
  breed: {
    type: String,
    default: 'Companion'
  },
  ageGroup: {
    type: String,
    required: [true, 'Please select your pet\'s age group'],
    enum: ['puppy', 'adult', 'senior']
  },
  activityLevel: {
    type: String,
    required: [true, 'Please select your pet\'s activity level'],
    enum: ['low', 'moderate', 'high']
  },
  weight: {
    type: Number,
    required: [true, 'Please enter your pet\'s weight in kg']
  },
  caloricTarget: {
    type: Number,
    required: true
  },
  dailyPortions: {
    type: Number,
    required: true
  },
  recommendedMeal: {
    type: String,
    required: true
  },
  planName: {
    type: String,
    required: true
  },
  planPrice: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Pet', PetSchema);
