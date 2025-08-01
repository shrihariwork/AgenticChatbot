# Premium Real Estate Chatbot - Bangalore

A production-grade, agentic chatbot designed for premium real estate companies in Bangalore, India. This intelligent system provides personalized property recommendations, market insights, and expert consultation through natural language conversations.

## 🏗️ Features

### 🤖 Intelligent Chatbot
- **Natural Language Processing**: Powered by OpenAI GPT-4 for human-like conversations
- **Context Awareness**: Maintains conversation context and user preferences
- **Intent Recognition**: Automatically detects user intent and extracts relevant information
- **Property Recommendations**: Smart property matching based on user requirements
- **Market Insights**: Real-time market trends and analysis for Bangalore

### 🏠 Property Management
- **Comprehensive Property Database**: Detailed property listings with specifications
- **Advanced Search**: Filter by location, price, type, amenities, and more
- **Featured Properties**: Highlight premium and exclusive listings
- **Property Analytics**: View counts, inquiries, and performance metrics
- **Similar Properties**: AI-powered property recommendations

### 💬 Real-time Communication
- **Socket.IO Integration**: Real-time chat with typing indicators
- **Session Management**: Persistent conversation history
- **Suggested Actions**: Context-aware quick action buttons
- **Rich Media Support**: Property images and documents

### 🔒 Production-Ready Security
- **Rate Limiting**: Protect against abuse and DDoS attacks
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Secure cross-origin requests
- **Helmet Security**: HTTP headers security
- **JWT Authentication**: Secure user authentication

### 📊 Analytics & Monitoring
- **Comprehensive Logging**: Winston-based structured logging
- **Performance Monitoring**: Request/response tracking
- **Error Handling**: Graceful error management
- **Health Checks**: System health monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB 4.4+
- Redis 6.0+
- OpenAI API Key

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd premium-real-estate-chatbot
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB and Redis**
```bash
# MongoDB
mongod

# Redis
redis-server
```

5. **Run the application**
```bash
# Development
npm run dev

# Production
npm start
```

6. **Access the application**
```
http://localhost:3000
```

## 📋 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/real-estate-chatbot |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `JWT_SECRET` | JWT secret key | Required |

### Database Setup

The application uses MongoDB for data persistence. Key collections:

- **Properties**: Property listings and details
- **Chats**: Conversation history and context
- **Users**: User accounts and preferences

### Redis Setup

Redis is used for:
- Session caching
- Response caching
- Rate limiting
- Real-time features

## 🏗️ Architecture

### Backend Structure
```
├── server.js              # Main server file
├── config/                # Configuration files
│   ├── database.js        # MongoDB connection
│   └── redis.js          # Redis connection
├── models/                # Database models
│   ├── Property.js       # Property schema
│   └── Chat.js           # Chat schema
├── services/              # Business logic
│   └── chatbotService.js # Chatbot core logic
├── routes/                # API routes
│   ├── chat.js           # Chat endpoints
│   ├── properties.js     # Property endpoints
│   └── auth.js           # Authentication
├── middleware/            # Custom middleware
│   └── errorHandler.js   # Error handling
├── socket/                # Socket.IO handlers
│   └── chatHandler.js    # Real-time chat
├── utils/                 # Utilities
│   └── logger.js         # Logging utility
└── public/                # Frontend assets
    ├── index.html         # Main HTML
    ├── styles.css         # Styling
    └── app.js            # Frontend logic
```

### Frontend Features
- **Responsive Design**: Mobile-first approach
- **Modern UI**: Clean, premium interface
- **Real-time Updates**: Live chat and notifications
- **Interactive Elements**: Modals, forms, and animations
- **Accessibility**: WCAG compliant design

## 🎯 Usage Examples

### Chatbot Interactions

**Property Search**
```
User: "I'm looking for a 2BHK apartment in Indiranagar"
Bot: "I found several excellent 2BHK apartments in Indiranagar. Here are some options that match your requirements..."
```

**Market Analysis**
```
User: "What are the current market trends in Bangalore?"
Bot: "The Bangalore real estate market is showing strong growth, particularly in tech corridors. Here are the key trends..."
```

**Property Details**
```
User: "Tell me more about the luxury villa in Whitefield"
Bot: "This premium villa in Whitefield features 4 bedrooms, 5 bathrooms, and 5000 sqft of living space..."
```

### API Endpoints

**Chat**
- `POST /api/chat/message` - Send chat message
- `GET /api/chat/history/:sessionId` - Get chat history
- `POST /api/chat/recommendations` - Get property recommendations
- `GET /api/chat/market-insights` - Get market insights

**Properties**
- `GET /api/properties` - List properties with filters
- `GET /api/properties/:id` - Get property details
- `POST /api/properties` - Create new property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

**Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

## 🔧 Development

### Scripts
```bash
npm run dev      # Start development server
npm start        # Start production server
npm test         # Run tests
npm run lint     # Lint code
npm run format   # Format code
npm run build    # Build for production
```

### Adding New Features

1. **Database Models**: Add new schemas in `models/`
2. **API Routes**: Create new routes in `routes/`
3. **Services**: Add business logic in `services/`
4. **Frontend**: Update HTML, CSS, and JavaScript in `public/`

### Testing
```bash
# Run all tests
npm test

# Run specific test file
npm test -- --grep "chatbot"

# Run with coverage
npm test -- --coverage
```

## 🚀 Deployment

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production MongoDB and Redis
3. Set secure JWT secret
4. Enable HTTPS
5. Configure reverse proxy (nginx)

### Monitoring
- **Health Check**: `GET /health`
- **Logs**: Check `logs/` directory
- **Metrics**: Monitor via Winston logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact: support@premiumrealestate.com
- Documentation: [Wiki Link]

## 🔮 Roadmap

- [ ] Multi-language support
- [ ] Voice chat integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] AI-powered property valuation
- [ ] Virtual property tours
- [ ] Lead management system
- [ ] Payment integration

---

**Built with ❤️ for the premium real estate industry in Bangalore** 