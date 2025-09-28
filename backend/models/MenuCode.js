const mongoose = require('mongoose');

const menuCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    length: 5
  },
  cupSize: {
    type: String,
    enum: ['S', 'M', 'L'],
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usedBy: {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    usedAt: Date
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Code expires after 24 hours
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate random code
menuCodeSchema.statics.generateCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

// Create new menu code
menuCodeSchema.statics.createCode = async function(cupSize, createdBy) {
  let code;
  let isUnique = false;
  
  // Keep generating until we get a unique code
  while (!isUnique) {
    code = this.generateCode();
    const existing = await this.findOne({ code });
    if (!existing) {
      isUnique = true;
    }
  }
  
  const menuCode = new this({
    code,
    cupSize,
    createdBy
  });
  
  return menuCode.save();
};

// Validate and use code
menuCodeSchema.statics.validateAndUse = async function(code, orderId) {
  const menuCode = await this.findOne({ 
    code: code.toUpperCase(),
    isUsed: false
  });
  
  if (!menuCode) {
    throw new Error('Invalid or already used code');
  }
  
  // Check if expired
  if (menuCode.expiresAt < new Date()) {
    throw new Error('Code has expired');
  }
  
  // Mark as used
  menuCode.isUsed = true;
  menuCode.usedBy = {
    order: orderId,
    usedAt: new Date()
  };
  
  await menuCode.save();
  return menuCode;
};

// Clean up expired codes (can be run as a cron job)
menuCodeSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    isUsed: false,
    expiresAt: { $lt: new Date() }
  });
  return result.deletedCount;
};

module.exports = mongoose.model('MenuCode', menuCodeSchema);