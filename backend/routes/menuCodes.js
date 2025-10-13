const express = require('express');
const { body, validationResult } = require('express-validator');
const MenuCode = require('../models/MenuCode');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/menu-codes/generate (Admin only)
router.post('/generate', authenticate, isAdmin, [
  body('cupSize').isIn(['S', 'M', 'L']).withMessage('Invalid cup size')
], async (req, res) => {
  try {
    console.log('🎫 Generating menu code for size:', req.body.cupSize);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { cupSize } = req.body;
    
    const menuCode = await MenuCode.createCode(cupSize, req.user._id);
    
    console.log('✅ Menu code generated:', menuCode.code);
    
    res.status(201).json({
      message: 'Menu code generated successfully',
      code: menuCode.code,
      cupSize: menuCode.cupSize,
      expiresAt: menuCode.expiresAt,
      note: 'This code can be used once and will serve as the order tracking code'
    });
  } catch (error) {
    console.error('❌ Menu code generation error:', error);
    res.status(500).json({ 
      message: 'Failed to generate menu code',
      error: error.message 
    });
  }
});

// POST /api/menu-codes/validate
router.post('/validate', [
  body('code').notEmpty().isLength({ min: 5, max: 5 })
], async (req, res) => {
  try {
    const { code } = req.body;
    console.log('🔍 Validating menu code:', code);
    
    const menuCode = await MenuCode.findOne({
      code: code.toUpperCase()
    });
    
    console.log('📋 Code lookup result:', menuCode ? 'Found' : 'Not found');
    
    if (!menuCode) {
      console.log('❌ Code not found in database');
      return res.status(400).json({ 
        valid: false,
        message: 'Invalid code' 
      });
    }
    
    const usageCheck = menuCode.canBeUsed();
    
    if (!usageCheck.valid) {
      console.log('❌ Code cannot be used:', usageCheck.reason);
      return res.status(400).json({ 
        valid: false,
        message: usageCheck.reason 
      });
    }
    
    console.log('✅ Code is valid. Cup size:', menuCode.cupSize);
    
    res.json({
      valid: true,
      cupSize: menuCode.cupSize,
      message: 'Code is valid. Use this code to place your order and track it later.',
      note: 'This code will become your order tracking code after ordering'
    });
  } catch (error) {
    console.error('❌ Validation error:', error);
    res.status(500).json({ 
      message: 'Failed to validate code',
      error: error.message 
    });
  }
});

// GET /api/menu-codes/admin/all (Admin only)
router.get('/admin/all', authenticate, isAdmin, async (req, res) => {
  try {
    console.log('📋 Admin fetching all menu codes');
    
    const { status, cupSize } = req.query;
    const filter = {};
    
    if (status === 'used') {
      filter.isUsed = true;
    } else if (status === 'unused') {
      filter.isUsed = false;
    } else if (status === 'expired') {
      filter.isUsed = false;
      filter.expiresAt = { $lt: new Date() };
    }
    
    if (cupSize) {
      filter.cupSize = cupSize;
    }
    
    const codes = await MenuCode.find(filter)
      .populate('createdBy', 'fullName')
      .populate('order')
      .sort('-createdAt')
      .limit(100);
    
    console.log(`✅ Found ${codes.length} codes`);
    res.json({ codes });
  } catch (error) {
    console.error('❌ Error fetching codes:', error);
    res.status(500).json({ 
      message: 'Failed to fetch menu codes',
      error: error.message 
    });
  }
});

// DELETE /api/menu-codes/admin/cleanup (Admin only)
router.delete('/admin/cleanup', authenticate, isAdmin, async (req, res) => {
  try {
    console.log('🧹 Cleaning up expired codes');
    
    const deletedCount = await MenuCode.cleanupExpired();
    
    console.log(`✅ Deleted ${deletedCount} expired codes`);
    res.json({
      message: `Cleaned up ${deletedCount} expired unused codes`,
      deletedCount
    });
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    res.status(500).json({ 
      message: 'Failed to cleanup codes',
      error: error.message 
    });
  }
});

// GET /api/menu-codes/admin/stats (Admin only)
router.get('/admin/stats', authenticate, isAdmin, async (req, res) => {
  try {
    console.log('📊 Fetching menu code statistics');
    
    const stats = await MenuCode.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          used: [
            { $match: { isUsed: true } },
            { $count: 'count' }
          ],
          unused: [
            { $match: { isUsed: false } },
            { $count: 'count' }
          ],
          expired: [
            { 
              $match: { 
                isUsed: false,
                expiresAt: { $lt: new Date() }
              } 
            },
            { $count: 'count' }
          ],
          byCupSize: [
            { $group: { 
              _id: '$cupSize',
              total: { $sum: 1 },
              used: { $sum: { $cond: ['$isUsed', 1, 0] } }
            }}
          ]
        }
      }
    ]);
    
    const result = {
      total: stats[0].total[0]?.count || 0,
      used: stats[0].used[0]?.count || 0,
      unused: stats[0].unused[0]?.count || 0,
      expired: stats[0].expired[0]?.count || 0,
      byCupSize: stats[0].byCupSize
    };
    
    console.log('✅ Statistics:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch statistics',
      error: error.message 
    });
  }
});

module.exports = router;