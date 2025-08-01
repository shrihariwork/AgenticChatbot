const chatbotService = require('../services/chatbotService');
const { logger } = require('../utils/logger');
const { getRedisClient } = require('../config/redis');

const setupSocketHandlers = (io) => {
  // Store active connections
  const activeConnections = new Map();

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Store connection info
    activeConnections.set(socket.id, {
      sessionId: null,
      userId: null,
      connectedAt: Date.now()
    });

    // Handle chat message
    socket.on('chat_message', async (data) => {
      try {
        const { message, sessionId, userId, context } = data;

        if (!message || message.trim().length === 0) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        // Update connection info
        const connectionInfo = activeConnections.get(socket.id);
        if (connectionInfo) {
          connectionInfo.sessionId = sessionId;
          connectionInfo.userId = userId;
        }

        // Emit typing indicator
        socket.emit('typing_start');

        // Process message through chatbot service
        const result = await chatbotService.processMessage(
          sessionId,
          userId,
          message,
          context
        );

        // Stop typing indicator
        socket.emit('typing_stop');

        // Send response
        socket.emit('chat_response', {
          response: result.response,
          suggestedActions: result.suggestedActions,
          sessionId: result.sessionId,
          context: result.context,
          timestamp: Date.now()
        });

        // Cache response in Redis
        try {
          const redis = getRedisClient();
          await redis.setex(
            `socket_response:${sessionId}:${Date.now()}`,
            300, // 5 minutes
            JSON.stringify(result)
          );
        } catch (redisError) {
          logger.warn('Redis cache failed for socket:', redisError);
        }

      } catch (error) {
        logger.error('Error handling chat message:', error);
        socket.emit('error', {
          message: 'Sorry, I encountered an error. Please try again.',
          timestamp: Date.now()
        });
      }
    });

    // Handle property search
    socket.on('property_search', async (data) => {
      try {
        const { query, filters } = data;

        socket.emit('search_start');

        // Simulate search delay for better UX
        setTimeout(async () => {
          try {
            const Property = require('../models/Property');
            let searchQuery = { status: 'available' };

            if (query) {
              searchQuery.$or = [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { 'location.area': { $regex: query, $options: 'i' } }
              ];
            }

            if (filters) {
              Object.keys(filters).forEach(key => {
                if (filters[key]) {
                  searchQuery[key] = filters[key];
                }
              });
            }

            const properties = await Property.find(searchQuery)
              .sort({ featured: -1, createdAt: -1 })
              .limit(10);

            socket.emit('search_results', {
              properties,
              count: properties.length,
              query,
              filters
            });

          } catch (error) {
            logger.error('Error in property search:', error);
            socket.emit('search_error', {
              message: 'Error searching properties'
            });
          }
        }, 1000);

      } catch (error) {
        logger.error('Error handling property search:', error);
        socket.emit('error', {
          message: 'Error processing search request'
        });
      }
    });

    // Handle property details request
    socket.on('property_details', async (data) => {
      try {
        const { propertyId } = data;

        const Property = require('../models/Property');
        const property = await Property.findById(propertyId);

        if (!property) {
          socket.emit('property_not_found', {
            message: 'Property not found'
          });
          return;
        }

        // Increment view count
        await property.incrementViews();

        socket.emit('property_details', {
          property,
          timestamp: Date.now()
        });

      } catch (error) {
        logger.error('Error handling property details:', error);
        socket.emit('error', {
          message: 'Error fetching property details'
        });
      }
    });

    // Handle user typing
    socket.on('user_typing', (data) => {
      const { sessionId, isTyping } = data;
      socket.broadcast.emit('user_typing', {
        sessionId,
        isTyping,
        timestamp: Date.now()
      });
    });

    // Handle connection to specific room (for private chats)
    socket.on('join_room', (data) => {
      const { roomId } = data;
      socket.join(roomId);
      logger.info(`Socket ${socket.id} joined room: ${roomId}`);
    });

    // Handle leaving room
    socket.on('leave_room', (data) => {
      const { roomId } = data;
      socket.leave(roomId);
      logger.info(`Socket ${socket.id} left room: ${roomId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
      activeConnections.delete(socket.id);
    });

    // Handle error
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });
  });

  // Broadcast system messages
  const broadcastSystemMessage = (message) => {
    io.emit('system_message', {
      message,
      timestamp: Date.now()
    });
  };

  // Get active connections count
  const getActiveConnectionsCount = () => {
    return activeConnections.size;
  };

  // Get active sessions
  const getActiveSessions = () => {
    const sessions = new Set();
    activeConnections.forEach((connection) => {
      if (connection.sessionId) {
        sessions.add(connection.sessionId);
      }
    });
    return Array.from(sessions);
  };

  // Export utility functions
  return {
    broadcastSystemMessage,
    getActiveConnectionsCount,
    getActiveSessions
  };
};

module.exports = { setupSocketHandlers }; 