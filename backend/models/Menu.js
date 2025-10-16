// backend/models/Menu.js - Complete Menu Model

const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ['flavor', 'topping', 'size'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound unique index
menuItemSchema.index({ itemType: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);