const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow guest orders
  },
  menuCode: {
    type: String,
    required: true
  },
  customerCode: {
    type: String,
    required: true
  },
  cupSize: {
    type: String,
    enum: ['S', 'M', 'L'],
    required: true
  },
  shavedIce: {
    flavor: {
      type: String,
      enum: ['Strawberry', 'Thai Tea', 'Matcha', 'Milk', 'Green Tea'],
      required: true
    },
    points: {
      type: Number,
      required: true
    }
  },
  toppings: [{
    name: {
      type: String,
      enum: ['Apple', 'Cherry', 'Blueberry', 'Raspberry', 'Strawberry', 'Banana', 'Mango'],
      required: true
    },
    points: {
      type: Number,
      required: true
    }
  }],
  pricing: {
    basePrice: {
      type: Number,
      required: true
    },
    sizePrice: {
      type: Number,
      default: 0
    },
    toppingsPrice: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Paid', 'Refunded'],
    default: 'Unpaid'
  },
  specialInstructions: {
    type: String,
    maxlength: 200
  },
  timestamps: {
    ordered: {
      type: Date,
      default: Date.now
    },
    prepared: Date,
    ready: Date,
    completed: Date
  },
  isFreeDrink: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate unique order ID
orderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderId = `ORD${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Calculate total price
orderSchema.methods.calculateTotal = function() {
  let total = this.pricing.basePrice;
  
  // Size pricing
  const sizePrices = { S: 0, M: 10, L: 20 };
  total += sizePrices[this.cupSize] || 0;
  
  // Toppings pricing (10 baht per topping)
  total += this.toppings.length * 10;
  
  // Apply free drink if applicable
  if (this.isFreeDrink) {
    total = 0;
  }
  
  this.pricing.total = total;
  return total;
};

// Update status with timestamp
orderSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  
  const statusTimestamps = {
    'Preparing': 'prepared',
    'Ready': 'ready',
    'Completed': 'completed'
  };
  
  if (statusTimestamps[newStatus]) {
    this.timestamps[statusTimestamps[newStatus]] = new Date();
  }
  
  return this.save();
};

module.exports = mongoose.model('Order', orderSchema);