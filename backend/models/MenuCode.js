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
  // ✅ เปลี่ยนจาก usageCount เป็น order เดียว
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
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
  usedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ชั่วโมง
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate random code with uniqueness check
menuCodeSchema.statics.generateCode = async function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    code = '';
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    
    const existing = await this.findOne({ code });
    if (!existing) {
      return code;
    }
    
    attempts++;
  }
  
  throw new Error('Unable to generate unique code after maximum attempts');
};

// Create new menu code
menuCodeSchema.statics.createCode = async function(cupSize, createdBy) {
  let code = await this.generateCode();
  
  const menuCode = new this({
    code,
    cupSize,
    createdBy
  });
  
  return menuCode.save();
};

// ✅ Validate code - ตรวจสอบว่ายังไม่ถูกใช้
menuCodeSchema.statics.validateCode = async function(code) {
  const menuCode = await this.findOne({ 
    code: code.toUpperCase()
  });
  
  if (!menuCode) {
    throw new Error('Invalid code');
  }
  
  if (menuCode.expiresAt < new Date()) {
    throw new Error('Code has expired');
  }
  
  if (menuCode.isUsed) {
    throw new Error('Code has already been used');
  }
  
  return menuCode;
};

// ✅ ใช้ code และเชื่อมกับ order
menuCodeSchema.statics.useCode = async function(code, orderId) {
  const menuCode = await this.findOne({ 
    code: code.toUpperCase()
  });
  
  if (!menuCode) {
    throw new Error('Invalid code');
  }
  
  if (menuCode.expiresAt < new Date()) {
    throw new Error('Code has expired');
  }
  
  if (menuCode.isUsed) {
    throw new Error('Code has already been used');
  }
  
  menuCode.isUsed = true;
  menuCode.order = orderId;
  menuCode.usedAt = new Date();
  
  await menuCode.save();
  return menuCode;
};

// ✅ ดึง order จาก code
menuCodeSchema.statics.getOrderByCode = async function(code) {
  const menuCode = await this.findOne({ 
    code: code.toUpperCase()
  }).populate('order');
  
  if (!menuCode) {
    throw new Error('Invalid code');
  }
  
  if (!menuCode.order) {
    throw new Error('No order found for this code');
  }
  
  return menuCode.order;
};

// Check if code can still be used
menuCodeSchema.methods.canBeUsed = function() {
  if (this.expiresAt < new Date()) {
    return { valid: false, reason: 'Code has expired' };
  }
  
  if (this.isUsed) {
    return { valid: false, reason: 'Code has already been used' };
  }
  
  return { valid: true };
};

// ✅ Clean up expired codes ที่ยังไม่ได้ใช้
menuCodeSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    isUsed: false,
    expiresAt: { $lt: new Date() }
  });
  return result.deletedCount;
};

module.exports = mongoose.model('MenuCode', menuCodeSchema);