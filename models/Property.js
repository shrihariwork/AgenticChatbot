const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  type: {
    type: String,
    required: true,
    enum: ['residential', 'commercial', 'luxury', 'villa', 'apartment', 'office', 'retail', 'warehouse']
  },
  category: {
    type: String,
    required: true,
    enum: ['sale', 'rent', 'lease']
  },
  price: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    perUnit: {
      type: String,
      enum: ['sqft', 'sqm', 'acre', 'monthly', 'yearly'],
      default: 'sqft'
    }
  },
  location: {
    address: {
      type: String,
      required: true
    },
    area: {
      type: String,
      required: true
    },
    city: {
      type: String,
      default: 'Bangalore'
    },
    state: {
      type: String,
      default: 'Karnataka'
    },
    pincode: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  specifications: {
    area: {
      builtUp: Number, // in sqft
      carpet: Number,  // in sqft
      superBuiltUp: Number // in sqft
    },
    bedrooms: {
      type: Number,
      min: 0
    },
    bathrooms: {
      type: Number,
      min: 0
    },
    balconies: {
      type: Number,
      min: 0
    },
    parking: {
      type: Number,
      min: 0
    },
    floor: {
      type: Number,
      min: 0
    },
    totalFloors: {
      type: Number,
      min: 0
    },
    age: {
      type: Number,
      min: 0
    },
    furnishing: {
      type: String,
      enum: ['unfurnished', 'semi-furnished', 'fully-furnished']
    }
  },
  amenities: [{
    type: String,
    enum: [
      'swimming_pool', 'gym', 'garden', 'parking', 'security', 'elevator',
      'power_backup', 'water_supply', 'internet', 'clubhouse', 'playground',
      'shopping_center', 'hospital', 'school', 'metro_station', 'airport',
      'central_ac', 'modular_kitchen', 'wardrobe', 'balcony', 'terrace'
    ]
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  documents: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['brochure', 'floor_plan', 'legal_document', 'other']
    }
  }],
  status: {
    type: String,
    enum: ['available', 'sold', 'rented', 'under_negotiation', 'off_market'],
    default: 'available'
  },
  highlights: [String],
  nearbyPlaces: [{
    name: String,
    distance: Number, // in km
    type: {
      type: String,
      enum: ['metro', 'airport', 'hospital', 'school', 'mall', 'restaurant', 'park', 'office']
    }
  }],
  agent: {
    name: String,
    phone: String,
    email: String,
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  views: {
    type: Number,
    default: 0
  },
  inquiries: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  verified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
propertySchema.index({ 'location.city': 1, type: 1, category: 1 });
propertySchema.index({ 'price.amount': 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ featured: 1 });
propertySchema.index({ createdAt: -1 });
propertySchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for price per sqft
propertySchema.virtual('pricePerSqft').get(function() {
  if (this.specifications.area && this.specifications.area.builtUp) {
    return this.price.amount / this.specifications.area.builtUp;
  }
  return null;
});

// Pre-save middleware
propertySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to find properties by location
propertySchema.statics.findByLocation = function(city, area) {
  return this.find({
    'location.city': city,
    'location.area': { $regex: area, $options: 'i' }
  });
};

// Instance method to increment views
propertySchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

module.exports = mongoose.model('Property', propertySchema); 