const mongoose = require('mongoose');
require('dotenv').config();

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');
    
    // Try to connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/real-estate-chatbot';
    
    try {
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
      });
      
      console.log('✅ MongoDB connected successfully');
      
      // Create database and collections
      const db = mongoose.connection.db;
      
      // Create collections if they don't exist
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(col => col.name);
      
      if (!collectionNames.includes('properties')) {
        await db.createCollection('properties');
        console.log('✅ Created properties collection');
      }
      
      if (!collectionNames.includes('chats')) {
        await db.createCollection('chats');
        console.log('✅ Created chats collection');
      }
      
      // Create indexes for better performance
      const Property = require('../models/Property');
      await Property.createIndexes();
      console.log('✅ Created database indexes');
      
      console.log('\n📊 Database Setup Summary:');
      console.log('==========================');
      console.log(`Database: ${mongoose.connection.name}`);
      console.log(`Collections: ${collectionNames.join(', ')}`);
      console.log('Status: Ready for use');
      
    } catch (error) {
      console.log('⚠️  MongoDB not available, using in-memory storage');
      console.log('   To enable full functionality, install and start MongoDB');
      console.log('   Installation: https://docs.mongodb.com/manual/installation/');
    }
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase }; 