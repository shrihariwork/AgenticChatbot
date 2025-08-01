const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const chatbotService = require('../services/chatbotService');
const { logger } = require('../utils/logger');
const { getRedisClient } = require('../config/redis');

// Middleware to validate chat message
const validateChatMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('sessionId')
    .optional()
    .isString()
    .withMessage('Session ID must be a string'),
  body('userId')
    .optional()
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId')
];

// Process chat message
router.post('/message', validateChatMessage, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { message, sessionId, userId, context } = req.body;

    // Generate session ID if not provided
    const finalSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Process message through chatbot service
    const result = await chatbotService.processMessage(
      finalSessionId,
      userId,
      message,
      context
    );

    // Cache the response for potential quick retrieval
    try {
      const redis = getRedisClient();
      await redis.setex(
        `chat_response:${finalSessionId}:${Date.now()}`,
        300, // 5 minutes cache
        JSON.stringify(result)
      );
    } catch (redisError) {
      logger.warn('Redis cache failed:', redisError);
      // Continue without caching
    }

    res.json({
      success: true,
      data: {
        response: result.response,
        suggestedActions: result.suggestedActions,
        sessionId: result.sessionId,
        context: result.context
      }
    });

  } catch (error) {
    logger.error('Error processing chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get chat history
router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const Chat = require('../models/Chat');
    const chat = await Chat.findOne({ sessionId })
      .select('messages context status startedAt lastActivity')
      .lean();

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    // Paginate messages
    const messages = chat.messages
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      data: {
        sessionId: chat.sessionId,
        messages,
        context: chat.context,
        status: chat.status,
        startedAt: chat.startedAt,
        lastActivity: chat.lastActivity,
        totalMessages: chat.messages.length
      }
    });

  } catch (error) {
    logger.error('Error fetching chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get property recommendations
router.post('/recommendations', async (req, res) => {
  try {
    const { userPreferences } = req.body;

    if (!userPreferences) {
      return res.status(400).json({
        success: false,
        message: 'User preferences are required'
      });
    }

    const recommendations = await chatbotService.getPropertyRecommendations(userPreferences);

    res.json({
      success: true,
      data: {
        recommendations,
        count: recommendations.length
      }
    });

  } catch (error) {
    logger.error('Error getting property recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get market insights
router.get('/market-insights', async (req, res) => {
  try {
    const insights = await chatbotService.getMarketInsights();

    res.json({
      success: true,
      data: insights
    });

  } catch (error) {
    logger.error('Error getting market insights:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search properties
router.post('/search', async (req, res) => {
  try {
    const { query, filters = {} } = req.body;

    if (!query && Object.keys(filters).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query or filters are required'
      });
    }

    const Property = require('../models/Property');
    let searchQuery = { status: 'available' };

    // Text search
    if (query) {
      searchQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { 'location.area': { $regex: query, $options: 'i' } },
        { 'location.address': { $regex: query, $options: 'i' } }
      ];
    }

    // Apply filters
    if (filters.type) {
      searchQuery.type = filters.type;
    }

    if (filters.category) {
      searchQuery.category = filters.category;
    }

    if (filters.minPrice || filters.maxPrice) {
      searchQuery['price.amount'] = {};
      if (filters.minPrice) searchQuery['price.amount'].$gte = filters.minPrice;
      if (filters.maxPrice) searchQuery['price.amount'].$lte = filters.maxPrice;
    }

    if (filters.location) {
      searchQuery['location.area'] = { $regex: filters.location, $options: 'i' };
    }

    if (filters.bedrooms) {
      searchQuery['specifications.bedrooms'] = { $gte: filters.bedrooms };
    }

    const properties = await Property.find(searchQuery)
      .sort({ featured: -1, createdAt: -1 })
      .limit(parseInt(req.query.limit) || 20)
      .skip(parseInt(req.query.offset) || 0);

    const total = await Property.countDocuments(searchQuery);

    res.json({
      success: true,
      data: {
        properties,
        total,
        page: Math.floor((parseInt(req.query.offset) || 0) / (parseInt(req.query.limit) || 20)) + 1,
        totalPages: Math.ceil(total / (parseInt(req.query.limit) || 20))
      }
    });

  } catch (error) {
    logger.error('Error searching properties:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get chat analytics
router.get('/analytics', async (req, res) => {
  try {
    const Chat = require('../models/Chat');
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const analytics = await Chat.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalChats: { $sum: 1 },
          activeChats: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          completedChats: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalMessages: { $sum: { $size: '$messages' } },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    res.json({
      success: true,
      data: analytics[0] || {
        totalChats: 0,
        activeChats: 0,
        completedChats: 0,
        totalMessages: 0,
        avgDuration: 0
      }
    });

  } catch (error) {
    logger.error('Error getting chat analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 