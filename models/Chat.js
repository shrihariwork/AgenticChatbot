const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant', 'system']
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    intent: String,
    confidence: Number,
    entities: [{
      type: String,
      value: String,
      confidence: Number
    }],
    suggestedActions: [{
      type: String,
      label: String,
      value: String
    }]
  }
});

const chatSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  messages: [messageSchema],
  context: {
    userPreferences: {
      propertyType: [String],
      budget: {
        min: Number,
        max: Number,
        currency: {
          type: String,
          default: 'INR'
        }
      },
      location: [String],
      amenities: [String],
      bedrooms: {
        min: Number,
        max: Number
      }
    },
    currentProperty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property'
    },
    conversationStage: {
      type: String,
      enum: ['greeting', 'requirements', 'property_search', 'property_details', 'contact_info', 'follow_up'],
      default: 'greeting'
    },
    lastIntent: String,
    userSentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral'
    }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  tags: [String],
  notes: String
}, {
  timestamps: true
});

// Indexes
chatSchema.index({ sessionId: 1, createdAt: -1 });
chatSchema.index({ userId: 1, createdAt: -1 });
chatSchema.index({ status: 1, lastActivity: -1 });

// Virtual for message count
chatSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Virtual for conversation duration
chatSchema.virtual('conversationDuration').get(function() {
  if (this.lastActivity && this.startedAt) {
    return Math.floor((this.lastActivity - this.startedAt) / 1000);
  }
  return 0;
});

// Pre-save middleware to update lastActivity
chatSchema.pre('save', function(next) {
  this.lastActivity = Date.now();
  if (this.lastActivity && this.startedAt) {
    this.duration = Math.floor((this.lastActivity - this.startedAt) / 1000);
  }
  next();
});

// Static method to find active chats
chatSchema.statics.findActiveChats = function() {
  return this.find({ status: 'active' }).sort({ lastActivity: -1 });
};

// Static method to find chats by user
chatSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

// Instance method to add message
chatSchema.methods.addMessage = function(role, content, metadata = {}) {
  this.messages.push({
    role,
    content,
    timestamp: Date.now(),
    metadata
  });
  return this.save();
};

// Instance method to update context
chatSchema.methods.updateContext = function(updates) {
  this.context = { ...this.context, ...updates };
  return this.save();
};

// Instance method to complete chat
chatSchema.methods.completeChat = function() {
  this.status = 'completed';
  return this.save();
};

module.exports = mongoose.model('Chat', chatSchema); 