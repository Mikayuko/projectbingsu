// backend/scripts/seedCodes.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// MenuCode Schema
const menuCodeSchema = new mongoose.Schema({
  code: String,
  cupSize: String,
  isUsed: Boolean,
  createdBy: mongoose.Schema.Types.ObjectId,
  expiresAt: Date,
  createdAt: Date
});

const MenuCode = mongoose.model('MenuCode', menuCodeSchema);

async function seedMenuCodes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test codes to create
    const testCodes = [
      { code: 'TEST1', cupSize: 'S' },
      { code: 'TEST2', cupSize: 'M' },
      { code: 'TEST3', cupSize: 'L' },
      { code: 'DEMO1', cupSize: 'S' },
      { code: 'DEMO2', cupSize: 'M' },
      { code: 'DEMO3', cupSize: 'L' },
      { code: 'ABC12', cupSize: 'M' },
      { code: 'XYZ99', cupSize: 'L' },
      { code: 'BING1', cupSize: 'S' },
      { code: 'BING2', cupSize: 'M' },
    ];

    console.log('\n📝 Creating test menu codes...');
    
    for (const testCode of testCodes) {
      // Check if code already exists
      const existing = await MenuCode.findOne({ code: testCode.code });
      
      if (!existing) {
        const newCode = new MenuCode({
          code: testCode.code,
          cupSize: testCode.cupSize,
          isUsed: false,
          createdBy: new mongoose.Types.ObjectId(), // Dummy admin ID
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          createdAt: new Date()
        });
        
        await newCode.save();
        console.log(`✅ Created code: ${testCode.code} (Size: ${testCode.cupSize})`);
      } else {
        // Reset if already used
        if (existing.isUsed) {
          existing.isUsed = false;
          existing.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          await existing.save();
          console.log(`🔄 Reset code: ${testCode.code} (Size: ${testCode.cupSize})`);
        } else {
          console.log(`ℹ️ Code already exists: ${testCode.code}`);
        }
      }
    }

    console.log('\n🎉 Test codes created successfully!');
    console.log('\n📋 Available Test Codes:');
    console.log('=====================================');
    testCodes.forEach(code => {
      console.log(`  Code: ${code.code} | Cup Size: ${code.cupSize}`);
    });
    console.log('=====================================');
    console.log('\n💡 You can use any of these codes to test the ordering system!');

  } catch (error) {
    console.error('❌ Error seeding codes:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

// Run the seed function
seedMenuCodes();