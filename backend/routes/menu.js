// backend/routes/menu.js - Complete Menu Routes

const express = require('express');
const MenuItem = require('../models/Menu');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/menu - Get all menu items (public)
router.get('/', async (req, res) => {
  try {
    const { itemType, isActive } = req.query;
    const filter = {};
    
    if (itemType) filter.itemType = itemType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const items = await MenuItem.find(filter).sort('name');
    
    const grouped = {
      flavors: items.filter(i => i.itemType === 'flavor'),
      toppings: items.filter(i => i.itemType === 'topping'),
      sizes: items.filter(i => i.itemType === 'size')
    };
    
    res.json(grouped);
  } catch (error) {
    console.error('Failed to fetch menu:', error);
    res.status(500).json({ message: 'Failed to fetch menu', error: error.message });
  }
});

// POST /api/menu - Create or update menu item (Admin only)
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { itemType, name, price, isActive, description, image } = req.body;
    
    let item = await MenuItem.findOne({ itemType, name });
    
    if (item) {
      // Update existing
      item.price = price;
      item.isActive = isActive !== undefined ? isActive : item.isActive;
      if (description !== undefined) item.description = description;
      if (image !== undefined) item.image = image;
      await item.save();
      
      console.log(`✅ Updated menu item: ${name}`);
    } else {
      // Create new
      item = await MenuItem.create({
        itemType,
        name,
        price,
        isActive: isActive !== undefined ? isActive : true,
        description: description || '',
        image: image || ''
      });
      
      console.log(`✅ Created menu item: ${name}`);
    }
    
    res.json({
      message: 'Menu item saved successfully',
      item
    });
  } catch (error) {
    console.error('Failed to save menu item:', error);
    res.status(500).json({ message: 'Failed to save menu item', error: error.message });
  }
});

// PUT /api/menu/:id - Update menu item (Admin only)
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { price, isActive, description, image } = req.body;
    const item = await MenuItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    if (price !== undefined) item.price = price;
    if (isActive !== undefined) item.isActive = isActive;
    if (description !== undefined) item.description = description;
    if (image !== undefined) item.image = image;
    
    await item.save();
    
    console.log(`✅ Updated menu item: ${item.name}`);
    
    res.json({
      message: 'Menu item updated successfully',
      item
    });
  } catch (error) {
    console.error('Failed to update menu item:', error);
    res.status(500).json({ message: 'Failed to update menu item', error: error.message });
  }
});

// DELETE /api/menu/:id - Delete menu item (Admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    console.log(`✅ Deleted menu item: ${item.name}`);
    
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Failed to delete menu item:', error);
    res.status(500).json({ message: 'Failed to delete menu item', error: error.message });
  }
});

// POST /api/menu/initialize - Initialize default menu (Admin only)
router.post('/initialize', authenticate, isAdmin, async (req, res) => {
  try {
    console.log('🌱 Initializing menu items...');
    
    const defaultMenu = [
      // Flavors
      { itemType: 'flavor', name: 'Strawberry', price: 60, description: 'Sweet strawberry', image: '/images/strawberry-ice.png' },
      { itemType: 'flavor', name: 'Thai Tea', price: 60, description: 'Creamy Thai tea', image: '/images/thai-tea-ice.png' },
      { itemType: 'flavor', name: 'Matcha', price: 60, description: 'Green tea matcha', image: '/images/matcha-ice.png' },
      
      // Toppings
      { itemType: 'topping', name: 'Apple', price: 10, description: 'Fresh apple chunks', image: '/images/apple.png' },
      { itemType: 'topping', name: 'Cherry', price: 10, description: 'Sweet cherries', image: '/images/cherry.png' },
      { itemType: 'topping', name: 'Blueberry', price: 10, description: 'Juicy blueberries', image: '/images/blueberry.png' },
      { itemType: 'topping', name: 'Raspberry', price: 10, description: 'Tangy raspberries', image: '/images/raspberry.png' },
      { itemType: 'topping', name: 'Strawberry', price: 10, description: 'Fresh strawberries', image: '/images/strawberry.png' },
      
      // Sizes
      { itemType: 'size', name: 'S', price: 0, description: 'Small size' },
      { itemType: 'size', name: 'M', price: 10, description: 'Medium size' },
      { itemType: 'size', name: 'L', price: 20, description: 'Large size' }
    ];
    
    let created = 0;
    let updated = 0;
    
    for (const item of defaultMenu) {
      const existing = await MenuItem.findOne({ 
        itemType: item.itemType, 
        name: item.name 
      });
      
      if (!existing) {
        await MenuItem.create(item);
        created++;
        console.log(`  ✅ Created: ${item.name} (${item.itemType})`);
      } else {
        existing.price = item.price;
        existing.description = item.description || existing.description;
        existing.image = item.image || existing.image;
        existing.isActive = true;
        await existing.save();
        updated++;
        console.log(`  🔄 Updated: ${item.name} (${item.itemType})`);
      }
    }
    
    console.log(`✅ Menu initialization complete: ${created} created, ${updated} updated`);
    
    res.json({
      message: `Initialized menu: ${created} created, ${updated} updated`,
      created,
      updated
    });
  } catch (error) {
    console.error('❌ Failed to initialize menu:', error);
    res.status(500).json({ message: 'Failed to initialize menu', error: error.message });
  }
});

module.exports = router;