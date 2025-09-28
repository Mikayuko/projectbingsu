const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const MenuCode = require('../models/MenuCode');
const User = require('../models/User');
const { authenticate, optionalAuth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders/create
router.post('/create', optionalAuth, [
  body('menuCode').notEmpty().isLength({ min: 5, max: 5 }),
  body('shavedIce').isObject(),
  body('toppings').isArray(),
  body('specialInstructions').optional().isLength({ max: 200 })
], async (req, res) => {
  try {
    const { menuCode, shavedIce, toppings, specialInstructions } = req.body;
    
    // Validate menu code
    const codeDoc = await MenuCode.findOne({ 
      code: menuCode.toUpperCase(),
      isUsed: false
    });
    
    if (!codeDoc) {
      return res.status(400).json({ message: 'Invalid or already used menu code' });
    }
    
    if (codeDoc.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Menu code has expired' });
    }
    
    // Generate customer code
    const customerCode = `#${Math.random().toString(36).substr(2, 5)}`;
    
    // Create order
    const order = new Order({
      customerId: req.user?._id,
      menuCode: menuCode.toUpperCase(),
      customerCode,
      cupSize: codeDoc.cupSize,
      shavedIce,
      toppings,
      specialInstructions,
      pricing: {
        basePrice: 60, // Base price for bingsu
      }
    });
    
    // Calculate total
    order.calculateTotal();
    
    // Check if user gets free drink (9th stamp)
    let earnedFreeDrink = false;
    if (req.user) {
      const user = await User.findById(req.user._id);
      earnedFreeDrink = user.addLoyaltyStamp();
      
      if (earnedFreeDrink) {
        order.isFreeDrink = true;
        order.calculateTotal(); // Recalculate with free drink
      }
      
      // Add to order history
      user.orderHistory.push(order._id);
      user.loyaltyPoints += Math.floor(order.pricing.total / 10); // 1 point per 10 baht
      await user.save();
    }
    
    await order.save();
    
    // Mark code as used
    await MenuCode.validateAndUse(menuCode, order._id);
    
    res.status(201).json({
      message: 'Order created successfully',
      order,
      customerCode,
      earnedFreeDrink
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

// GET /api/orders/track/:customerCode
router.get('/track/:customerCode', async (req, res) => {
  try {
    const order = await Order.findOne({ 
      customerCode: req.params.customerCode 
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to track order' });
  }
});

// GET /api/orders/my-orders
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ 
      customerId: req.user._id 
    }).sort('-createdAt');
    
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Admin Routes

// GET /api/orders/admin/all
router.get('/admin/all', authenticate, isAdmin, async (req, res) => {
  try {
    const { status, date } = req.query;
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.createdAt = { $gte: startDate, $lt: endDate };
    }
    
    const orders = await Order.find(filter)
      .populate('customerId', 'fullName email')
      .sort('-createdAt');
    
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// PUT /api/orders/admin/:orderId/status
router.put('/admin/:orderId/status', authenticate, isAdmin, [
  body('status').isIn(['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'])
], async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    await order.updateStatus(status);
    
    res.json({ 
      message: 'Order status updated',
      order 
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

// GET /api/orders/admin/stats
router.get('/admin/stats', authenticate, isAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = await Order.aggregate([
      {
        $facet: {
          todayOrders: [
            { $match: { createdAt: { $gte: today } } },
            { $count: 'count' }
          ],
          todayRevenue: [
            { 
              $match: { 
                createdAt: { $gte: today },
                paymentStatus: 'Paid'
              } 
            },
            { $group: { _id: null, total: { $sum: '$pricing.total' } } }
          ],
          pendingOrders: [
            { $match: { status: 'Pending' } },
            { $count: 'count' }
          ],
          popularFlavors: [
            { $group: { 
              _id: '$shavedIce.flavor',
              count: { $sum: 1 }
            }},
            { $sort: { count: -1 } },
            { $limit: 5 }
          ]
        }
      }
    ]);
    
    res.json({
      todayOrders: stats[0].todayOrders[0]?.count || 0,
      todayRevenue: stats[0].todayRevenue[0]?.total || 0,
      pendingOrders: stats[0].pendingOrders[0]?.count || 0,
      popularFlavors: stats[0].popularFlavors
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

module.exports = router;