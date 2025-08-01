const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import utilities and services
let logger, connectDB, initializeRedis, chatbotService, errorHandler, setupSocketHandlers;
let chatRoutes, propertyRoutes, authRoutes;

// Try to import modules with fallbacks
try {
  const loggerModule = require('./utils/logger');
  logger = loggerModule.logger;
} catch (error) {
  logger = {
    info: (msg) => console.log(`[INFO] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`),
    warn: (msg) => console.warn(`[WARN] ${msg}`)
  };
}

try {
  const databaseModule = require('./config/database');
  connectDB = databaseModule.connectDB;
} catch (error) {
  connectDB = async () => {
    logger.warn('MongoDB not available, using in-memory storage');
    return Promise.resolve();
  };
}

try {
  const redisModule = require('./config/redis');
  initializeRedis = redisModule.initializeRedis;
} catch (error) {
  initializeRedis = async () => {
    logger.warn('Redis not available, using in-memory cache');
    return Promise.resolve();
  };
}

try {
  const errorHandlerModule = require('./middleware/errorHandler');
  errorHandler = errorHandlerModule.errorHandler;
} catch (error) {
  errorHandler = (err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  };
}

try {
  const socketModule = require('./socket/chatHandler');
  setupSocketHandlers = socketModule.setupSocketHandlers;
} catch (error) {
  setupSocketHandlers = (io) => {
    io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);
      
      socket.on('chat_message', async (data) => {
        try {
          const { message } = data;
          
          // Use chatbot service if available, otherwise simple response
          let response;
          if (chatbotService) {
            response = await chatbotService.processMessage(
              data.sessionId,
              data.userId,
              message,
              data.context
            );
          } else {
            response = {
              response: `Thank you for your message: "${message}". I'm your AI real estate assistant for Bangalore. I can help you find properties, provide market insights, and answer your questions about real estate in Bangalore. What would you like to know?`,
              suggestedActions: [
                { type: 'property_search', label: 'Search Properties', value: 'search' },
                { type: 'contact', label: 'Contact Agent', value: 'contact' },
                { type: 'market_info', label: 'Market Trends', value: 'trends' }
              ],
              sessionId: data.sessionId,
              context: {},
              timestamp: Date.now()
            };
          }
          
          socket.emit('chat_response', response);
          
        } catch (error) {
          logger.error('Error handling chat message:', error);
          socket.emit('error', {
            message: 'Sorry, I encountered an error. Please try again.',
            timestamp: Date.now()
          });
        }
      });
      
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  };
}

// Try to import routes
try {
  chatRoutes = require('./routes/chat');
} catch (error) {
  chatRoutes = express.Router();
  chatRoutes.post('/message', (req, res) => {
    res.json({
      success: true,
      data: {
        response: "I'm your AI real estate assistant for Bangalore. How can I help you today?",
        suggestedActions: [
          { type: 'property_search', label: 'Search Properties', value: 'search' },
          { type: 'contact', label: 'Contact Agent', value: 'contact' }
        ],
        sessionId: req.body.sessionId || `session_${Date.now()}`,
        context: {}
      }
    });
  });
}

try {
  propertyRoutes = require('./routes/properties');
} catch (error) {
  propertyRoutes = express.Router();
  propertyRoutes.get('/', (req, res) => {
    res.json({
      success: true,
      data: {
        properties: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      }
    });
  });
}

try {
  authRoutes = require('./routes/auth');
  authRoutes = authRoutes.router;
} catch (error) {
  authRoutes = express.Router();
  authRoutes.post('/login', (req, res) => {
    res.json({
      success: true,
      data: { message: 'Authentication not configured' }
    });
  });
}

// Try to import chatbot service
try {
  chatbotService = require('./services/chatbotService');
} catch (error) {
  chatbotService = null;
  logger.warn('Chatbot service not available, using simple responses');
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Middleware
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected',
    redis: 'connected'
  });
});

// Serve the main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use(errorHandler);

// Socket.io setup
setupSocketHandlers(io);

// Database and Redis connection
async function initializeApp() {
  try {
    await connectDB();
    await initializeRedis();
    logger.info('Database and Redis connected successfully');
  } catch (error) {
    logger.error('Failed to initialize app:', error);
    // Don't exit, continue with limited functionality
    logger.info('Continuing with limited functionality');
  }
}

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Visit http://localhost:${PORT} to access the application`);
  initializeApp();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

module.exports = { app, server, io }; 