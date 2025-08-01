const mongoose = require('mongoose');
const Property = require('../models/Property');
require('dotenv').config();

const sampleProperties = [
  {
    title: "Luxury 3BHK Apartment in Indiranagar",
    description: "Stunning 3-bedroom apartment in the heart of Indiranagar with modern amenities, spacious living area, and premium finishes. Perfect for families looking for luxury living in Bangalore's most sought-after neighborhood.",
    type: "residential",
    category: "sale",
    price: {
      amount: 25000000,
      currency: "INR",
      perUnit: "sqft"
    },
    location: {
      address: "100 Feet Road, Indiranagar",
      area: "Indiranagar",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560038",
      coordinates: {
        latitude: 12.9716,
        longitude: 77.5946
      }
    },
    specifications: {
      area: {
        builtUp: 1800,
        carpet: 1650,
        superBuiltUp: 2000
      },
      bedrooms: 3,
      bathrooms: 3,
      balconies: 2,
      parking: 2,
      floor: 8,
      totalFloors: 15,
      age: 2,
      furnishing: "semi-furnished"
    },
    amenities: [
      "swimming_pool", "gym", "garden", "parking", "security", "elevator",
      "power_backup", "water_supply", "internet", "clubhouse", "playground",
      "shopping_center", "hospital", "school", "metro_station"
    ],
    status: "available",
    highlights: [
      "Premium location in Indiranagar",
      "Modern amenities and facilities",
      "Spacious 3BHK layout",
      "Excellent connectivity"
    ],
    nearbyPlaces: [
      { name: "Indiranagar Metro Station", distance: 0.5, type: "metro" },
      { name: "Phoenix MarketCity", distance: 2.0, type: "mall" },
      { name: "Manipal Hospital", distance: 1.5, type: "hospital" },
      { name: "Airport", distance: 15.0, type: "airport" }
    ],
    agent: {
      name: "Rahul Sharma",
      phone: "+91-9876543210",
      email: "rahul.sharma@premiumrealestate.com"
    },
    featured: true,
    verified: true
  },
  {
    title: "Premium 2BHK Apartment in Koramangala",
    description: "Beautiful 2-bedroom apartment in Koramangala with contemporary design, excellent connectivity, and all modern amenities. Ideal for young professionals and small families.",
    type: "residential",
    category: "rent",
    price: {
      amount: 45000,
      currency: "INR",
      perUnit: "monthly"
    },
    location: {
      address: "8th Block, Koramangala",
      area: "Koramangala",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560034",
      coordinates: {
        latitude: 12.9352,
        longitude: 77.6245
      }
    },
    specifications: {
      area: {
        builtUp: 1200,
        carpet: 1100,
        superBuiltUp: 1350
      },
      bedrooms: 2,
      bathrooms: 2,
      balconies: 1,
      parking: 1,
      floor: 5,
      totalFloors: 12,
      age: 1,
      furnishing: "fully-furnished"
    },
    amenities: [
      "gym", "parking", "security", "elevator", "power_backup",
      "water_supply", "internet", "playground", "shopping_center"
    ],
    status: "available",
    highlights: [
      "Fully furnished apartment",
      "Great location in Koramangala",
      "Modern amenities",
      "Excellent for working professionals"
    ],
    nearbyPlaces: [
      { name: "Koramangala Metro Station", distance: 1.0, type: "metro" },
      { name: "Forum Mall", distance: 2.5, type: "mall" },
      { name: "Apollo Hospital", distance: 3.0, type: "hospital" }
    ],
    agent: {
      name: "Priya Patel",
      phone: "+91-9876543211",
      email: "priya.patel@premiumrealestate.com"
    },
    featured: true,
    verified: true
  },
  {
    title: "Luxury Villa in Whitefield",
    description: "Exclusive 4-bedroom villa in Whitefield with private garden, swimming pool, and premium finishes. Perfect for families seeking luxury living in Bangalore's IT hub.",
    type: "villa",
    category: "sale",
    price: {
      amount: 85000000,
      currency: "INR",
      perUnit: "sqft"
    },
    location: {
      address: "Whitefield Main Road, Whitefield",
      area: "Whitefield",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560066",
      coordinates: {
        latitude: 12.9716,
        longitude: 77.5946
      }
    },
    specifications: {
      area: {
        builtUp: 4500,
        carpet: 4200,
        superBuiltUp: 5000
      },
      bedrooms: 4,
      bathrooms: 5,
      balconies: 3,
      parking: 4,
      floor: 1,
      totalFloors: 2,
      age: 0,
      furnishing: "unfurnished"
    },
    amenities: [
      "swimming_pool", "gym", "garden", "parking", "security",
      "power_backup", "water_supply", "internet", "clubhouse",
      "shopping_center", "hospital", "school", "airport"
    ],
    status: "available",
    highlights: [
      "Luxury villa with private pool",
      "Premium location in Whitefield",
      "Spacious 4BHK layout",
      "Private garden and amenities"
    ],
    nearbyPlaces: [
      { name: "Whitefield Metro Station", distance: 2.0, type: "metro" },
      { name: "Phoenix MarketCity", distance: 3.0, type: "mall" },
      { name: "Airport", distance: 25.0, type: "airport" }
    ],
    agent: {
      name: "Arun Kumar",
      phone: "+91-9876543212",
      email: "arun.kumar@premiumrealestate.com"
    },
    featured: true,
    verified: true
  },
  {
    title: "Commercial Office Space in MG Road",
    description: "Premium office space in the heart of MG Road, perfect for corporate headquarters or business centers. High-end facilities and excellent connectivity.",
    type: "commercial",
    category: "lease",
    price: {
      amount: 150000,
      currency: "INR",
      perUnit: "monthly"
    },
    location: {
      address: "MG Road, Central Bangalore",
      area: "MG Road",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
      coordinates: {
        latitude: 12.9716,
        longitude: 77.5946
      }
    },
    specifications: {
      area: {
        builtUp: 5000,
        carpet: 4800,
        superBuiltUp: 5500
      },
      bedrooms: 0,
      bathrooms: 4,
      balconies: 0,
      parking: 20,
      floor: 10,
      totalFloors: 25,
      age: 3,
      furnishing: "unfurnished"
    },
    amenities: [
      "parking", "security", "elevator", "power_backup",
      "water_supply", "internet", "shopping_center", "metro_station"
    ],
    status: "available",
    highlights: [
      "Premium office space in MG Road",
      "Excellent connectivity",
      "High-end facilities",
      "Perfect for corporate headquarters"
    ],
    nearbyPlaces: [
      { name: "MG Road Metro Station", distance: 0.2, type: "metro" },
      { name: "Commercial Street", distance: 0.5, type: "mall" },
      { name: "Airport", distance: 30.0, type: "airport" }
    ],
    agent: {
      name: "Meera Iyer",
      phone: "+91-9876543213",
      email: "meera.iyer@premiumrealestate.com"
    },
    featured: true,
    verified: true
  },
  {
    title: "Modern 1BHK Apartment in Electronic City",
    description: "Contemporary 1-bedroom apartment in Electronic City, perfect for young professionals working in the tech hub. Modern amenities and excellent connectivity.",
    type: "residential",
    category: "rent",
    price: {
      amount: 25000,
      currency: "INR",
      perUnit: "monthly"
    },
    location: {
      address: "Electronic City Phase 1",
      area: "Electronic City",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560100",
      coordinates: {
        latitude: 12.8458,
        longitude: 77.6655
      }
    },
    specifications: {
      area: {
        builtUp: 800,
        carpet: 750,
        superBuiltUp: 900
      },
      bedrooms: 1,
      bathrooms: 1,
      balconies: 1,
      parking: 1,
      floor: 3,
      totalFloors: 10,
      age: 1,
      furnishing: "semi-furnished"
    },
    amenities: [
      "parking", "security", "elevator", "power_backup",
      "water_supply", "internet", "playground"
    ],
    status: "available",
    highlights: [
      "Perfect for tech professionals",
      "Modern amenities",
      "Great connectivity to IT companies",
      "Affordable rental option"
    ],
    nearbyPlaces: [
      { name: "Electronic City Metro Station", distance: 1.5, type: "metro" },
      { name: "Infosys Campus", distance: 2.0, type: "office" },
      { name: "Wipro Campus", distance: 3.0, type: "office" }
    ],
    agent: {
      name: "Suresh Reddy",
      phone: "+91-9876543214",
      email: "suresh.reddy@premiumrealestate.com"
    },
    featured: false,
    verified: true
  },
  {
    title: "Luxury Penthouse in Jayanagar",
    description: "Exclusive penthouse in Jayanagar with panoramic city views, private terrace, and luxury amenities. The epitome of sophisticated living in Bangalore.",
    type: "luxury",
    category: "sale",
    price: {
      amount: 120000000,
      currency: "INR",
      perUnit: "sqft"
    },
    location: {
      address: "4th Block, Jayanagar",
      area: "Jayanagar",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560011",
      coordinates: {
        latitude: 12.9242,
        longitude: 77.5855
      }
    },
    specifications: {
      area: {
        builtUp: 3500,
        carpet: 3200,
        superBuiltUp: 4000
      },
      bedrooms: 3,
      bathrooms: 4,
      balconies: 2,
      parking: 3,
      floor: 20,
      totalFloors: 20,
      age: 0,
      furnishing: "fully-furnished"
    },
    amenities: [
      "swimming_pool", "gym", "garden", "parking", "security", "elevator",
      "power_backup", "water_supply", "internet", "clubhouse", "playground",
      "shopping_center", "hospital", "school", "metro_station", "central_ac"
    ],
    status: "available",
    highlights: [
      "Luxury penthouse with city views",
      "Private terrace and amenities",
      "Premium location in Jayanagar",
      "Fully furnished with luxury finishes"
    ],
    nearbyPlaces: [
      { name: "Jayanagar Metro Station", distance: 0.8, type: "metro" },
      { name: "Jayanagar Shopping Complex", distance: 1.0, type: "mall" },
      { name: "Airport", distance: 20.0, type: "airport" }
    ],
    agent: {
      name: "Vikram Singh",
      phone: "+91-9876543215",
      email: "vikram.singh@premiumrealestate.com"
    },
    featured: true,
    verified: true
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/real-estate-chatbot', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Clear existing properties
    await Property.deleteMany({});
    console.log('Cleared existing properties');
    
    // Insert sample properties
    const insertedProperties = await Property.insertMany(sampleProperties);
    console.log(`Successfully inserted ${insertedProperties.length} properties`);
    
    // Display summary
    console.log('\n📊 Property Summary:');
    console.log('=====================');
    
    const propertyTypes = await Property.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    propertyTypes.forEach(type => {
      console.log(`${type._id}: ${type.count} properties`);
    });
    
    const featuredCount = await Property.countDocuments({ featured: true });
    console.log(`Featured properties: ${featuredCount}`);
    
    const totalValue = await Property.aggregate([
      { $group: { _id: null, total: { $sum: '$price.amount' } } }
    ]);
    
    if (totalValue.length > 0) {
      console.log(`Total property value: ₹${totalValue[0].total.toLocaleString()}`);
    }
    
    console.log('\n✅ Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleProperties }; 