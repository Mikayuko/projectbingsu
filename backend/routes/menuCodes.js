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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { cupSize } = req.body;
    
    // Create new menu code
    const menuCode = await MenuCode.createCode(cupSize, req.user._id);
    
    res.status(201).json({
      message: 'Menu code generated successfully',
      code: menuCode.code,
      cupSize: menuCode.cupSize,
      expiresAt: menuCode.expiresAt
    });
  } catch (error) {
    console.error('Menu code generation error:', error);
    res.status(500).json({ message: 'Failed to generate menu code' });
  }
});

// POST /api/menu-codes/validate
router.post('/validate', [
  body('code').notEmpty().isLength({ min: 5, max: 5 })
], async (req, res) => {
  try {
    const { code } = req.body;
    
    const menuCode = await MenuCode.findOne({
      code: code.toUpperCase(),
      isUsed: false
    });
    
    if (!menuCode) {
      return res.status(400).json({ 
        valid: false,
        message: 'Invalid or already used code' 
      });
    }
    
    if (menuCode.expiresAt < new Date()) {
      return res.status(400).json({ 
        valid: false,
        message: 'Code has expired' 
      });
    }
    
    res.json({
      valid: true,
      cupSize: menuCode.cupSize,
      message: 'Code is valid'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to validate code' });
  }
});

// GET /api/menu-codes/admin/all (Admin only)
router.get('/admin/all', authenticate, isAdmin, async (req, res) => {
  try {
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
      .populate('usedBy.order')
      .sort('-createdAt')
      .limit(100); // Limit to prevent too large response
    
    res.json({ codes });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch menu codes' });
  }
});

// DELETE /api/menu-codes/admin/cleanup (Admin only)
router.delete('/admin/cleanup', authenticate, isAdmin, async (req, res) => {
  try {
    const deletedCount = await MenuCode.cleanupExpired();
    
    res.json({
      message: `Cleaned up ${deletedCount} expired codes`,
      deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cleanup codes' });
  }
});

// GET /api/menu-codes/admin/stats (Admin only)
router.get('/admin/stats', authenticate, isAdmin, async (req, res) => {
  try {
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
              count: { $sum: 1 }
            }}
          ]
        }
      }
    ]);
    
    res.json({
      total: stats[0].total[0]?.count || 0,
      used: stats[0].used[0]?.count || 0,
      unused: stats[0].unused[0]?.count || 0,
      expired: stats[0].expired[0]?.count || 0,
      byCupSize: stats[0].byCupSize
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

module.exports = router;